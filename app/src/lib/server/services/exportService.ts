/**
 * Export Service
 * Exports images with paired .txt caption files as a downloadable zip archive.
 * 
 * Archive structure:
 * export_2026-06-07/
 *   image_001.png
 *   image_001.txt  (trainingPrompt content)
 *   image_002.png
 *   image_002.txt
 *   ...
 * 
 * Note: Requires 'adm-zip' package for zip creation.
 * Install with: npm install adm-zip @types/adm-zip
 */

import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { FileModel } from '$lib/server/models/fileModel';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Lazy import adm-zip to avoid startup errors if not yet installed
let AdmZip: any;
function getAdmZip(): any {
    if (!AdmZip) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            AdmZip = require('adm-zip');
        } catch {
            throw new Error('adm-zip package is required for export. Run: npm install adm-zip @types/adm-zip');
        }
    }
    return AdmZip;
}

class ExportService {
    /**
     * Export selected images as a zip archive with caption files.
     */
    async exportSelected(
        imageIds: string[],
        includeWithoutCaptions: boolean = false
    ): Promise<{
        buffer: Buffer;
        filename: string;
        itemCount: number;
    }> {
        // Fetch images
        const images: AppImageData[] = [];
        for (const id of imageIds) {
            const image = await ImageModel.getImageById(id);
            if (image) {
                // Filter out images without captions if requested
                if (!includeWithoutCaptions && !image.trainingPrompt) {
                    continue;
                }
                images.push(image);
            }
        }

        if (images.length === 0) {
            throw new Error('No images to export');
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const zipFilename = `training-export-${dateStr}.zip`;

        // Create zip in memory
        const Zip = getAdmZip();
        const zip = new Zip();

        // Add each image and its caption file
        for (const image of images) {
            try {
                // Read the image file
                const imageBuffer = await FileModel.read(image.imagePath);

                // Get the base filename without extension
                const baseName = image.sanitizedFilename.replace(/\.[^/.]+$/, '');
                const ext = image.imagePath.split('.').pop() || 'png';

                // Add image to archive
                zip.addFile(`${baseName}.${ext}`, imageBuffer);

                // Add caption file
                const captionContent = image.trainingPrompt 
                    ? image.trainingPrompt 
                    : '# No training caption set for this image';
                zip.addFile(`${baseName}.txt`, Buffer.from(captionContent, 'utf-8'));
            } catch (error) {
                console.warn(`Failed to export image ${image._id}:`, error);
            }
        }

        const zipBuffer = zip.toBuffer();

        return {
            buffer: zipBuffer,
            filename: zipFilename,
            itemCount: images.length,
        };
    }

    /**
     * Export images from a group as a zip archive.
     */
    async exportGroup(
        groupId: string,
        includeWithoutCaptions: boolean = false
    ): Promise<{
        buffer: Buffer;
        filename: string;
        itemCount: number;
    }> {
        // Get group children
        const { GroupModel } = await import('$lib/server/models/groupModel');
        const group = await GroupModel.getGroupById(groupId);

        if (!group || !group.children || group.children.length === 0) {
            throw new Error('Group not found or has no images');
        }

        return this.exportSelected(group.children, includeWithoutCaptions);
    }
}

export const exportService = new ExportService();
