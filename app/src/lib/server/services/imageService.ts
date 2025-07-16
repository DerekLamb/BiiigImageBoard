import { ImageModel } from "../models/imageModel"
import { type AppImageData } from "../models/imageModel"
import { FileModel } from "../models/fileModel"
import { imageFileUtil } from "../utility/imageUtil"

import 'fluent-ffmpeg';
import Ffmpeg from "fluent-ffmpeg";


export const imageService = {
    async updateThumbnail(image: AppImageData, buffer?: Buffer , overwrite = false){

        const thumbnailExists = await FileModel.checkExists(image.thumbnailPath);

        if (thumbnailExists) {
            if (overwrite) {
                await FileModel.delete(image.thumbnailPath);
            } else {
                return false;
            }
        }

        const thumbnailname = `${image.uploadDate}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;
    
        try{
            buffer = buffer ? buffer : await FileModel.read(image.imagePath);
            const thumbnail = await imageFileUtil.createImageThumbnail(buffer);
            
            await ImageModel.updateImage(image._id, "thumbnailPath", thumbnailPath);

            try{
                await FileModel.write(thumbnailPath, thumbnail);
            } catch{
                await ImageModel.updateImage(image._id, "thumbnailPath", '');
                return false;
            }
        } catch {
            console.log(`Error updating thumbnail for ${image._id}`);
            return false;
        }

        return true;
    },

    async updateVideoThumbnail(imageData: AppImageData, overwrite = false){

        const thumbnailExists = await FileModel.checkExists(imageData.thumbnailPath);
        const thumbnailname = `${imageData.uploadDate}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;

        if (thumbnailExists) {
            if (overwrite) {
                await FileModel.delete(imageData.thumbnailPath);
            } else {
                return false;
            }
        }

        try{
            await new Promise((resolve, reject) => {
                Ffmpeg(imageData.imagePath)
                .screenshots({
                    timestamps: ['10%'],  // Default to 10% timestamp
                    filename: thumbnailname,
                    folder: "thumb/",
                    size: '320x?',      // Maintain aspect ratio
                })
                .on('end', resolve)
                .on('error', reject);
                ImageModel.updateImage(imageData._id, "thumbnailPath", thumbnailPath);
            });
            
        } catch (error) {
            await ImageModel.updateImage(imageData._id, "thumbnailPath", '');
            return false;
        }
    }
}