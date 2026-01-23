import type { imageProcessingAdapter } from "./types";
import type { AppImageData } from "$lib/server/models/imageModel";
import { FileModel } from "$lib/server/models/fileModel";
import { ImageModel } from "$lib/server/models/imageModel";

class LocalImageProcessing implements imageProcessingAdapter {

    async createThumbnail(imageData: AppImageData, buffer: Buffer): Promise<boolean> {
        if (!imageData.thumbnailPath) {
            return false;
        }

        const thumbnailExists = await FileModel.checkExists(imageData.thumbnailPath);

        if (thumbnailExists) {
            return false;
        }

        const thumbnailname = `${imageData.uploadDate}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;

        try {
            buffer = buffer ? buffer : await FileModel.read(imageData.imagePath);
            const thumbnail = await FileModel.createThumbnail(buffer);

            await ImageModel.updateImage(imageData._id, "thumbnailPath", thumbnailPath);

            try {
                await FileModel.write(thumbnailPath, thumbnail);
                return true;
            } catch {
                await ImageModel.updateImage(imageData._id, "thumbnailPath", '');
                return false;
            }
        } catch (error) {
            console.error(`Error updating thumbnail for ${imageData._id}: ${error}`);
            return false;
        }
    }

    async createVideoThumbnail(imageData: AppImageData): Promise<boolean> {
        if (!imageData.thumbnailPath) {
            return false;
        }

        const thumbnailExists = await FileModel.checkExists(imageData.thumbnailPath);
        const thumbnailname = `${imageData.uploadDate}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;

        if (thumbnailExists) {
            return false;
        }

        try {
            await new Promise((resolve, reject) => {
                const Ffmpeg = require('fluent-ffmpeg');
                Ffmpeg(imageData.imagePath)
                    .screenshots({
                        timestamps: ['10%'],
                        filename: thumbnailname,
                        folder: "thumb/",
                        size: '320x?',
                    })
                    .on('end', resolve)
                    .on('error', reject);
                ImageModel.updateImage(imageData._id, "thumbnailPath", thumbnailPath);
            });

            return true;
        } catch (error) {
            await ImageModel.updateImage(imageData._id, "thumbnailPath", '');
            return false;
        }
    }
}

export const localImageProcessing = new LocalImageProcessing();
