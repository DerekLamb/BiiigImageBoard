import { ImageModel, type AppImageData } from '../models/imageModel';
import { FileModel } from '../models/fileModel';


class ImageController{
    constructor() {
    }

    async getImage(id: string){
        const image = await ImageModel.getImageById(id);
        return image;
    }

    async getImageByTimestamp(timestamp: string){
        const image = await ImageModel.getImageByTimestamp(timestamp);
        return image;
    }

    async getAdjacents(sort: string, value: string){
        return await ImageModel.getAdjacents(sort, value);
    }

    async getPage(params: {page: number, length: number, search?: string, sort?: string}){
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        //const search = params.search || "";
        const filter = { };

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
        try {
            await FileModel.write(imageData.imagePath, buffer);
            // create thumbnail next
            return await ImageModel.addImage(imageData);
        } catch (error) {
            console.log(`Error adding image: ${imageData._id}`);
            return false;
        }

    }

}

export default new ImageController();