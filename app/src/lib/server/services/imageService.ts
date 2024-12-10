import { ImageModel } from "../models/imageModel"
import { type AppImageData } from "../models/imageModel"
import { FileModel } from "../models/fileModel"
import { imageFileUtil } from "../utility/imageUtil"


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
    
        try{
            buffer = buffer ? buffer : await FileModel.read(image.imagePath);
            const thumbnail = await imageFileUtil.createImageThumbnail(buffer);
            const thumbnailname = `${image.sanitizedFilename}_thmb.webp`;
            const thumbnailPath = `thumb/${thumbnailname}`;
            
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
    }
}
