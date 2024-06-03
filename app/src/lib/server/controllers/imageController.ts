import { ImageModel } from '$lib/server/models/imageModel';
import { type AppImageData } from "../types";
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
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        const search = params.search || '';
        const filter =  search ? { tags: { $regex: search, $options: 'i' }} : {};

        const images = await ImageModel.findImages(filter, length, skip, sort);

        return images
    }

    async getImageCount(){
        return await ImageModel.countImages();
    }

    async deleteImage(imageData: AppImageData){
        const image = await ImageModel.getImageById(imageData._id);
        try{
            await ImageModel.deleteImage(imageData._id);
            await FileModel.delete(image.imagePath);
            await FileModel.delete(image.thumbnailPath);
        }
        catch(error)
        {
            console.log(`Error deleting image: ${image._id}`);
            return false;
        }
        return true;
    }

    async addImage(imageData: AppImageData, buffer: Buffer){
        await FileModel.write(imageData.imagePath, buffer);
        return await ImageModel.addImage(imageData);
    }
    
    async newImage(file: imgFile, uniqueID: string){
        let buffer = Buffer.from(await file.arrayBuffer());
        let hash = await FileModel.hashFile(buffer);
        let ext = file.name.split('.').pop();
        // let uID = uniqueID; 
        let newFileName = `${uniqueID}.${ext}`;
        
        const imageDataObj : AppImageData = {
            _id: hash,
            type: "image",
            originalName: file.name,
            sanitizedFilename: newFileName,
            imagePath: `${this.defaultPath}${newFileName}`, 
            uploadDate: uniqueID,
            thumbnailPath: "",
            groups: [],
            tags: []
        }
        
        try{
            const dbResults = await this.addImage(imageDataObj, buffer)
            imageService.updateThumbnail(imageDataObj, buffer);
            return dbResults;
        } catch (error: any) {
            if (error.code === 11000) {
                console.error(`Error processing file ${file.name}: MongoServerError: E11000 duplicate key error`);
            } else {
                throw new Error(`Error processing file ${file.name}: ${error}`);
            }
        }
    }
    
    async updateImageProperty<ImageProp extends keyof AppImageData>(id: string, propToUpdate: ImageProp, value: AppImageData[ImageProp]) {
        const results = ImageModel.updateImage(id, propToUpdate, value);
        if(!results){
            console.log("No Updates made to ", id)
        }
    }

    async updateAllThumbnails(){
        const total = await ImageModel.countImages();
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