import { ImageModel } from "../models/imageModel"
import { type AppImageData } from "../models/imageModel"
import { FileModel } from "../models/fileModel"


export const imageService = {
    async updateThumbnail(image: AppImageData, buffer?: Buffer ){
        // if(image.thumbnailPath !== '' || image.thumbnailPath === undefined){
        //     return true;
        // }

        if(await FileModel.checkExists(image.thumbnailPath)){
            return true;
        }

        buffer = buffer ? buffer : await FileModel.read(image.imagePath);
        const thumbnail = await FileModel.createThumbnail(buffer);
        const thumbnailname = `${image.sanitizedFilename}_thmb.webp`;
        const thumbnailPath = `thumb/${thumbnailname}`;
        try{
            await ImageModel.updateImage(image._id, "thumbnailPath", thumbnailPath);

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
