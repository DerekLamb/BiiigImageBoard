import { ImageModel } from "../models/imageModel"
import { type AppImageData } from "../models/imageModel"
import { FileModel } from "../models/fileModel"
import { imageUtil } from "../utility/imageUtil"


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
    
        buffer = buffer ? buffer : await FileModel.read(image.imagePath);
        const thumbnail = await imageUtil.createThumbnail(buffer);
        const thumbnailname = `${image.sanitizedFilename}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;
        try{
            await ImageModel.updateImage(image._id, "thumbnailPath", thumbnailPath); // I know I know, reusing thumbnailPath twice. I want to replace with a constant from a central lib file TODO 

            try{
                console.log(thumbnail);
                await FileModel.write(thumbnailPath, thumbnail);
                console.log(`${thumbnailPath} ${image._id}`);
                
            } catch{
                console.log(`Error writing thumbnail for ${image._id}`);
                await ImageModel.updateImage(image._id, "thumbnailPath", '');
                return false;
            }
        } catch {
            console.log(`Error updating thumbnail for ${image._id}`);
            return false;
        } 
        
    }
}
