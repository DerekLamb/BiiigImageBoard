/**
 * Image Processor Service
 * Handles batch processing of images for thumbnails, prompt extraction, and dHash computation
 * Processes in batches of 5-10 async jobs to avoid overloading the Node.js engine
 */

import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { FileModel } from '$lib/server/models/fileModel';
import { imageService } from '$lib/server/services/imageService';
import { dhash } from '$lib/server/services/perceptualHash';
import promptDecode from '$lib/ExtractPrompt';
import type { BatchProcessingResult, TaskQueueStats } from './types';

// Configuration for batch processing
const BATCH_SIZE = 5; // Process 5 images at a time (can be adjusted to 10)
const BATCH_DELAY_MS = 100; // Small delay between batches to prevent CPU spikes

interface ProcessingTask {
    imageId: string;
    needsThumbnail: boolean;
    needsPromptExtraction: boolean;
    needsDHash: boolean;
}

class ImageProcessor {
    private stats: TaskQueueStats = {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0
    };

    private isProcessing = false;

    /**
     * Get current processing statistics
     */
    getStats(): TaskQueueStats {
        return { ...this.stats };
    }

    /**
     * Check if processor is currently running
     */
    isActive(): boolean {
        return this.isProcessing;
    }

    /**
     * Find all images that need processing (missing thumbnail, prompt extraction, or dHash)
     */
    async findImagesNeedingProcessing(limit = 100): Promise<ProcessingTask[]> {
        const tasks: ProcessingTask[] = [];
        
        // Get images without thumbnails
        const imagesWithoutThumbnails = await ImageModel.findImages(
            {
                $or: [
                    { thumbnailPath: { $exists: false } },
                    { thumbnailPath: '' },
                    { thumbnailPath: null }
                ]
            },
            limit,
            0
        );

        for (const image of imagesWithoutThumbnails) {
            const existing = tasks.find(t => t.imageId === image._id);
            if (existing) {
                existing.needsThumbnail = true;
            } else {
                tasks.push({
                    imageId: image._id,
                    needsThumbnail: true,
                    needsPromptExtraction: false,
                    needsDHash: false
                });
            }
        }

        // Get images without extracted prompts (only for image type, not video)
        const imagesWithoutPrompts = await ImageModel.findImages(
            {
                type: 'image',
                $or: [
                    { embPrompt: { $exists: false } },
                    { embPrompt: null },
                    { embPrompt: [] }
                ]
            },
            limit,
            0
        );

        for (const image of imagesWithoutPrompts) {
            const existing = tasks.find(t => t.imageId === image._id);
            if (existing) {
                existing.needsPromptExtraction = true;
            } else {
                tasks.push({
                    imageId: image._id,
                    needsThumbnail: false,
                    needsPromptExtraction: true,
                    needsDHash: false
                });
            }
        }

        // Get images without dHash (images only, not video)
        const imagesWithoutDHash = await ImageModel.findImages(
            {
                type: 'image',
                $or: [
                    { dhash: { $exists: false } },
                    { dhash: null },
                    { dhash: '' }
                ]
            },
            limit,
            0
        );

        for (const image of imagesWithoutDHash) {
            const existing = tasks.find(t => t.imageId === image._id);
            if (existing) {
                existing.needsDHash = true;
            } else {
                tasks.push({
                    imageId: image._id,
                    needsThumbnail: false,
                    needsPromptExtraction: false,
                    needsDHash: true
                });
            }
        }

        return tasks;
    }

    /**
     * Process a single image - create thumbnail, extract prompt, and/or compute dHash
     */
    private async processImage(image: AppImageData, task: ProcessingTask): Promise<{ success: boolean; error?: string }> {
        const errors: string[] = [];

        // Process thumbnail if needed
        if (task.needsThumbnail) {
            try {
                if (image.type === 'video') {
                    await imageService.updateVideoThumbnail(image, false);
                } else {
                    const buffer = await FileModel.read(image.imagePath);
                    await imageService.updateThumbnail(image, buffer, false);
                }
            } catch (error) {
                errors.push(`Thumbnail failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Process prompt extraction if needed
        if (task.needsPromptExtraction && image.type === 'image') {
            try {
                const buffer = await FileModel.read(image.imagePath);
                // Convert Buffer to ArrayBuffer for promptDecode
                const arrayBuffer = new Uint8Array(buffer).buffer as ArrayBuffer;
                const promptData = promptDecode(arrayBuffer);
                
                if (promptData) {
                    await ImageModel.updateImage(image._id, 'embPrompt', promptData);
                }
            } catch (error) {
                errors.push(`Prompt extraction failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Process dHash if needed
        if (task.needsDHash && image.type === 'image') {
            try {
                const buffer = await FileModel.read(image.imagePath);
                const hash = await dhash(buffer);
                await ImageModel.updateImage(image._id, 'dhash', hash);
            } catch (error) {
                errors.push(`dHash computation failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        return {
            success: errors.length === 0,
            error: errors.length > 0 ? errors.join('; ') : undefined
        };
    }

    /**
     * Process a batch of images concurrently
     */
    private async processBatch(
        images: AppImageData[],
        tasks: ProcessingTask[]
    ): Promise<Array<{ imageId: string; success: boolean; error?: string }>> {
        const promises = images.map(async (image) => {
            const task = tasks.find(t => t.imageId === image._id);
            if (!task) {
                return { imageId: image._id, success: false, error: 'Task not found' };
            }
            
            const result = await this.processImage(image, task);
            return { imageId: image._id, ...result };
        });

        return Promise.all(promises);
    }

    /**
     * Main processing function - processes all images needing attention in batches
     */
    async processAllImages(onProgress?: (stats: TaskQueueStats) => void): Promise<BatchProcessingResult> {
        if (this.isProcessing) {
            throw new Error('Processing already in progress');
        }

        this.isProcessing = true;
        this.stats = { pending: 0, running: 0, completed: 0, failed: 0 };

        const result: BatchProcessingResult = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: []
        };

        try {
            // Find all images needing processing
            const tasks = await this.findImagesNeedingProcessing();
            this.stats.pending = tasks.length;
            result.total = tasks.length;

            // Process in batches
            for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
                const batchTasks = tasks.slice(i, i + BATCH_SIZE);
                const imageIds = batchTasks.map(t => t.imageId);

                // Fetch full image data for the batch
                const images = await Promise.all(
                    imageIds.map(id => ImageModel.getImageById(id))
                );

                const validImages = images.filter((img): img is AppImageData => img !== null);
                
                this.stats.pending -= batchTasks.length;
                this.stats.running += batchTasks.length;

                // Process batch concurrently
                const batchResults = await this.processBatch(validImages, batchTasks);

                // Update stats and collect results
                for (const batchResult of batchResults) {
                    if (batchResult.success) {
                        this.stats.completed++;
                        result.successful++;
                    } else {
                        this.stats.failed++;
                        result.failed++;
                        if (batchResult.error) {
                            result.errors.push({
                                imageId: batchResult.imageId,
                                error: batchResult.error
                            });
                        }
                    }
                }

                this.stats.running = 0;

                // Report progress
                if (onProgress) {
                    onProgress({ ...this.stats });
                }

                // Small delay between batches to prevent CPU spikes
                if (i + BATCH_SIZE < tasks.length) {
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
                }
            }
        } finally {
            this.isProcessing = false;
        }

        return result;
    }

    /**
     * Process a specific image by ID
     */
    async processImageById(imageId: string): Promise<{ success: boolean; error?: string }> {
        const image = await ImageModel.getImageById(imageId);
        if (!image) {
            return { success: false, error: 'Image not found' };
        }

        // Check what processing is needed
        const needsThumbnail = !image.thumbnailPath;
        const needsPromptExtraction = image.type === 'image' && (!image.embPrompt ||
            (image.embPrompt.positive.length === 0 && image.embPrompt.negative.length === 0));
        const needsDHash = image.type === 'image' && !image.dhash;

        if (!needsThumbnail && !needsPromptExtraction && !needsDHash) {
            return { success: true }; // Nothing to do
        }

        return this.processImage(image, {
            imageId,
            needsThumbnail,
            needsPromptExtraction,
            needsDHash
        });
    }

    /**
     * Process images for a specific group
     */
    async processGroupImages(groupChildren: string[]): Promise<BatchProcessingResult> {
        const result: BatchProcessingResult = {
            total: groupChildren.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Process in batches
        for (let i = 0; i < groupChildren.length; i += BATCH_SIZE) {
            const batchIds = groupChildren.slice(i, i + BATCH_SIZE);
            
            const batchResults = await Promise.all(
                batchIds.map(id => this.processImageById(id))
            );

            for (let j = 0; j < batchResults.length; j++) {
            if (batchResults[j].success) {
                result.successful++;
            } else {
                result.failed++;
                const errorMsg = batchResults[j].error;
                if (errorMsg) {
                    result.errors.push({
                        imageId: batchIds[j],
                        error: errorMsg
                    });
                }
            }
        }

            // Small delay between batches
            if (i + BATCH_SIZE < groupChildren.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        return result;
    }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
