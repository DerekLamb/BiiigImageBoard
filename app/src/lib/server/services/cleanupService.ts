/**
 * Cleanup Service
 * Orchestrates image cleanup operations through ComfyUI.
 * Creates new image entries linked to originals via the `related` field.
 */

import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { FileModel } from '$lib/server/models/fileModel';
import { localImageStorage } from '$lib/server/services/imageStorageAdapter/localImageStorage';
import { getComfyUIClient } from '$lib/server/services/comfyUIClient';
import watermarkRemovalWorkflow from '$lib/server/services/workflows/watermarkRemoval.json';
import upscalingWorkflow from '$lib/server/services/workflows/upscaling.json';
import img2imgCleanupWorkflow from '$lib/server/services/workflows/img2imgCleanup.json';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type CleanupOperation = 'watermark_removal' | 'upscale' | 'img2img_cleanup' | 'full_pipeline';
export type CleanupJobStatus = 'pending' | 'running' | 'completed' | 'failed';

interface CleanupResult {
    success: boolean;
    originalImageId: string;
    resultImageId?: string;
    error?: string;
}

interface BatchCleanupResult {
    total: number;
    successful: number;
    failed: number;
    results: CleanupResult[];
}

interface CleanupJob {
    id: string;
    imageId: string;
    operation: CleanupOperation;
    status: CleanupJobStatus;
    resultImageId?: string;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

// In-memory job tracking (could be migrated to DB later)
const jobs: Map<string, CleanupJob> = new Map();

const WORKFLOW_MAP: Record<Exclude<CleanupOperation, 'full_pipeline'>, object> = {
    watermark_removal: watermarkRemovalWorkflow,
    upscale: upscalingWorkflow,
    img2img_cleanup: img2imgCleanupWorkflow,
};

class CleanupService {
    private comfyClient = getComfyUIClient();

    /**
     * Run a single cleanup operation on an image.
     * Creates a new image entry linked via the `related` field.
     */
    async cleanupImage(imageId: string, operation: CleanupOperation): Promise<CleanupResult> {
        const job: CleanupJob = {
            id: `cleanup-${uuidv4()}`,
            imageId,
            operation,
            status: 'pending',
            createdAt: new Date(),
        };
        jobs.set(job.id, job);

        try {
            job.status = 'running';

            // Get original image
            const originalImage = await ImageModel.getImageById(imageId);
            if (!originalImage) {
                throw new Error('Image not found');
            }

            let resultImageId: string;

            if (operation === 'full_pipeline') {
                // Chain: watermark removal -> img2img cleanup -> upscale
                resultImageId = await this.runFullPipeline(originalImage, job);
            } else {
                resultImageId = await this.runSingleOperation(originalImage, operation, job);
            }

            job.status = 'completed';
            job.resultImageId = resultImageId;
            job.completedAt = new Date();

            return {
                success: true,
                originalImageId: imageId,
                resultImageId,
            };
        } catch (error: any) {
            job.status = 'failed';
            job.error = error.message;
            job.completedAt = new Date();

            return {
                success: false,
                originalImageId: imageId,
                error: error.message,
            };
        }
    }

    /**
     * Run cleanup on multiple images in sequence.
     */
    async batchCleanup(
        imageIds: string[],
        operation: CleanupOperation
    ): Promise<BatchCleanupResult> {
        const results: CleanupResult[] = [];

        for (const imageId of imageIds) {
            const result = await this.cleanupImage(imageId, operation);
            results.push(result);
        }

        const successful = results.filter(r => r.success).length;

        return {
            total: imageIds.length,
            successful,
            failed: imageIds.length - successful,
            results,
        };
    }

    /**
     * Get status of a cleanup job.
     */
    async getStatus(jobId: string): Promise<CleanupJob | null> {
        return jobs.get(jobId) || null;
    }

    /**
     * Check if ComfyUI is reachable.
     */
    async checkConnection(): Promise<{ connected: boolean; url: string }> {
        const connected = await this.comfyClient.ping();
        return { connected, url: this.comfyClient['serverAddress'] };
    }

    /**
     * Run a single cleanup operation.
     */
    private async runSingleOperation(
        originalImage: AppImageData,
        operation: Exclude<CleanupOperation, 'full_pipeline'>,
        job: CleanupJob
    ): Promise<string> {
        const workflow = JSON.parse(JSON.stringify(WORKFLOW_MAP[operation]));
        const inputBuffer = await FileModel.read(originalImage.imagePath);

        // Run through ComfyUI
        const outputBuffer = await this.comfyClient.processImage(inputBuffer, (uploadedFilename: string) => {
            // Replace the filename placeholder in the workflow
            const modifiedWorkflow: Record<string, any> = {};
            for (const [nodeId, nodeData] of Object.entries(workflow)) {
                if (typeof nodeData === 'object' && nodeData !== null && 'inputs' in nodeData) {
                    const node = nodeData as { inputs?: Record<string, unknown> };
                    if (node.inputs && 'image' in node.inputs) {
                        node.inputs.image = uploadedFilename;
                    }
                }
                modifiedWorkflow[nodeId] = nodeData;
            }
            return modifiedWorkflow;
        });

        return this.saveResultImage(originalImage, outputBuffer, operation);
    }

    /**
     * Run the full pipeline: watermark removal -> img2img cleanup -> upscale.
     */
    private async runFullPipeline(
        originalImage: AppImageData,
        job: CleanupJob
    ): Promise<string> {
        // Step 1: Watermark removal
        let currentBuffer = await FileModel.read(originalImage.imagePath);
        const watermarkResult = await this.runOperationWithBuffer(currentBuffer, 'watermark_removal');
        currentBuffer = watermarkResult;

        // Step 2: Img2img cleanup
        const cleanupResult = await this.runOperationWithBuffer(currentBuffer, 'img2img_cleanup');
        currentBuffer = cleanupResult;

        // Step 3: Upscale
        const upscaleResult = await this.runOperationWithBuffer(currentBuffer, 'upscale');
        currentBuffer = upscaleResult;

        // Save final result
        return this.saveResultImage(originalImage, currentBuffer, 'full_pipeline');
    }

    /**
     * Run a single operation on an in-memory buffer.
     */
    private async runOperationWithBuffer(
        buffer: Buffer,
        operation: Exclude<CleanupOperation, 'full_pipeline'>
    ): Promise<Buffer> {
        const workflow = JSON.parse(JSON.stringify(WORKFLOW_MAP[operation]));

        return this.comfyClient.processImage(buffer, (uploadedFilename: string) => {
            const modifiedWorkflow: Record<string, any> = {};
            for (const [nodeId, nodeData] of Object.entries(workflow)) {
                if (typeof nodeData === 'object' && nodeData !== null && 'inputs' in nodeData) {
                    const node = nodeData as { inputs?: Record<string, unknown> };
                    if (node.inputs && 'image' in node.inputs) {
                        node.inputs.image = uploadedFilename;
                    }
                }
                modifiedWorkflow[nodeId] = nodeData;
            }
            return modifiedWorkflow;
        });
    }

    /**
     * Save the cleaned-up image as a new entry in the database.
     * Links it to the original via the `related` field.
     */
    private async saveResultImage(
        originalImage: AppImageData,
        outputBuffer: Buffer,
        operation: CleanupOperation
    ): Promise<string> {
        const uniqueId = uuidv4().slice(0, 24);
        const ext = originalImage.imagePath.split('.').pop() || 'png';
        const suffix = operation.replace(/_/g, '_');
        const newFilename = `cleaned_${suffix}_${uniqueId}.${ext}`;
        const newImagePath = `images/${newFilename}`;

        // Save to disk
        await localImageStorage.writeImage(newImagePath, outputBuffer);

        // Create new image document
        const newImage: AppImageData = {
            _id: uniqueId,
            type: 'image',
            originalName: `[Cleaned] ${originalImage.originalName}`,
            sanitizedFilename: newFilename,
            imagePath: newImagePath,
            uploadDate: new Date().toISOString(),
            group: originalImage.group ? [...originalImage.group] : [],
            tags: originalImage.tags ? [...originalImage.tags] : [],
            related: [originalImage._id],
            trainingPrompt: originalImage.trainingPrompt,
        };

        // Insert into database
        const insertResult = await ImageModel.addImage(newImage);
        if (!insertResult.success) {
            throw new Error('Failed to save cleaned image to database');
        }

        // Add link back from original image to new cleaned version
        const currentRelated = originalImage.related || [];
        if (!currentRelated.includes(uniqueId)) {
            currentRelated.push(uniqueId);
            await ImageModel.updateImage(originalImage._id, 'related', currentRelated);
        }

        // Generate thumbnail for new image
        try {
            const { localImageProcessing } = await import('$lib/server/services/imageStorageAdapter/localImageProcessing');
            newImage.thumbnailPath = `thumb/${uniqueId}`;
            await localImageProcessing.createThumbnail(newImage, outputBuffer);
        } catch (error) {
            console.warn(`Failed to create thumbnail for cleaned image: ${error}`);
        }

        return uniqueId;
    }
}

export const cleanupService = new CleanupService();
