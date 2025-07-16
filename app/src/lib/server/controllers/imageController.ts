import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { FileModel } from '$lib/server/models/fileModel';
import { imageService } from '$lib/server/services/imageService';

const constDefaultPath = 'images/'; // default path if none specified

interface imgFile extends File {
    name: string;
}
class ImageController{
    defaultPath: string;
    
    constructor(defaultPath: string = 'images/') {
        this.defaultPath = defaultPath;
    }

    async getImage(id: string){
        const image = await ImageModel.getImageById(id);
        return image;
    }

    async getImageByTimestamp(timestamp: string){
        const image = await ImageModel.getImageByTimestamp(timestamp);
        return image;
    }

    async getAdjacents(sort: keyof AppImageData, value: string){
        return await ImageModel.getAdjacents(sort, value);
    }

    async getImagePage(params: {page: number, length: number, search?: string, sort?: string}){
        const search = params.search || '';
        const filter =  search ? { tags: { $regex: search, $options: 'i' }} : {};
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        
        const images = await ImageModel.findImages(filter, length, skip, sort);

        return images
    }

    async getImageCount(){
        return await ImageModel.countAllImages();
    }

    async deleteImage(imageData: AppImageData){
        const image = await ImageModel.getImageById(imageData._id);
        if (!image) return { success: false, error: "Image not found" };

        try{
            await ImageModel.deleteImage(imageData._id);
            await FileModel.delete(image.imagePath);
            if(image.thumbnailPath) { await FileModel.delete(image.thumbnailPath)};
            return {
                succes: true,
            };
        }
        catch(error: any)
        {
            return{
                success: false,
                error: error.message,
            }
        }
    }

    async addImage(imageData: AppImageData, buffer: Buffer){
        await FileModel.write(imageData.imagePath, buffer);
        return await ImageModel.addImage(imageData);
    }
    
    async updateImageProperty<ImageProp extends keyof AppImageData>(id: string, propToUpdate: ImageProp, value: AppImageData[ImageProp]) {
        const results = await ImageModel.updateImage(id, propToUpdate, value);
            return {
                success : results.success,
                updatedImage: results.document,
            }
    }

    async addImageToGroup(imageId: string, groupId: string) {
        try {
            let imageGroups  = (await ImageModel.getImageById(imageId)).group;
            if(imageGroups.indexOf(groupId) === -1){
                throw Error("group already exists on image");
            }

            imageGroups.push(groupId);
            const results = await ImageModel.updateImage(imageId, "group", imageGroups)

            return{
                success: results.success,
                message: "group added to " + results.document?._id 
            }
        } catch (error) 
        {
            return{
                success: false,
                error: error.message,
            }    
        }
    }
    
    async newImage(file: imgFile, uniqueID: string){
        //process image data 
        let buffer = Buffer.from(await file.arrayBuffer());
        let hash = await FileModel.hashFile(buffer);

        if (await ImageModel.uniqueHash(hash) > 0) { // check if duplicate _id: hash; prevents duplicate images from being inserted
            console.log(`Image already exists. _id:${hash} file.name:${file.name}`)
            console.log(await ImageModel.uniqueHash(hash)); 
            return null;
        }
        const supportedVideo = ["mp4", "webm", ]
        let ext = file.name.split('.').pop() ?? "";
        let newFileName = `${uniqueID}.${ext}`;
        
        let type = supportedVideo.includes(ext) ? "video" : "image"

        const imageDataObj : AppImageData = {
            _id: hash,
            originalName: file.name,
            sanitizedFilename: newFileName,
            imagePath: `${this.defaultPath}${newFileName}`, 
            uploadDate: uniqueID,
            thumbnailPath: "",
            group: [],
            tags: [],
            type: type
        }

        try{
            const dbResults = await this.addImage(imageDataObj, buffer)
            
            if(type === "video"){
                imageService.updateVideoThumbnail(imageDataObj, buffer);
            }
            else{
                imageService.updateThumbnail(imageDataObj, buffer);
            }

            return dbResults;
        } catch (error: any) {}
        
    }

    async updateAllThumbnails(){
        const total = await ImageModel.countAllImages();
        const page = total / 500;
        for (let i = 0; i < page; i++){
            const images = await ImageModel.findImages({}, 500, i * 500);
            for (let j = 0; j < images.length; j++){
                const imageData = images[j];
                await imageService.updateThumbnail(imageData);
            }
        }
    }

    async updateMissingThumbnails(){
        const images = await ImageModel.findImages({thumbnailPath: ''});
        for (let i = 0; i < images.length; i++){
            const imageData = images[i];
            await imageService.updateThumbnail(imageData);
        }
    }

}

export default new ImageController(constDefaultPath);