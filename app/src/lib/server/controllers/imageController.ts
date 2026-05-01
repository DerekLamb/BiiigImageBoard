import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { FileModel } from '$lib/server/models/fileModel';
import { localImageStorage } from '$lib/server/services/imageStorageAdapter/localImageStorage';
import { localImageProcessing } from '$lib/server/services/imageStorageAdapter/localImageProcessing';

const constDefaultPath = 'images/';

interface imgFile extends File {
    name: string;
}

class ImageController {
    defaultPath: string;

    constructor(defaultPath: string = 'images/') {
        this.defaultPath = defaultPath;
    }

    async getImage(id: string) {
        const image = await ImageModel.getImageById(id);
        return image;
    }

    async getImageByTimestamp(timestamp: string) {
        const image = await ImageModel.getImageByTimestamp(timestamp);
        return image;
    }

    async getAdjacents(sort: keyof AppImageData, value: string) {
        return await ImageModel.getAdjacents(sort, value);
    }

    async getImagePage(params: { page: number, length: number, search?: string, sort?: string }) {
        const search = params.search || '';
        const filter = search ? { tags: { $regex: search, $options: 'i' }} : {};
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;

        const images = await ImageModel.findImages(filter, length, skip, sort);

        return images;
    }

    async getImageCount() {
        return await ImageModel.countAllImages();
    }

    async deleteImage(imageData: AppImageData | AppImageData[]) {
        const images = Array.isArray(imageData) ? imageData : [imageData];
        const results = [];

        for (const img of images) {
            const image = await ImageModel.getImageById(img._id);
            if (!image) {
                results.push({
                    success: false,
                    message: `Image ${img._id} not found`,
                    id: img._id
                });
                continue;
            }

            try {
                await ImageModel.deleteImage(img._id);
                await localImageStorage.deleteImage(image.imagePath);
                if (image.thumbnailPath) {
                    await localImageStorage.deleteThumbnail(image.thumbnailPath);
                }
                results.push({
                    success: true,
                    message: "Image deleted successfully",
                    id: img._id
                });
            } catch (error: any) {
                console.error("Error deleting image:", error);
                results.push({
                    success: false,
                    message: "Failed to delete image",
                    id: img._id
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;

        return {
            success: successCount > 0,
            message: `Deleted ${successCount} of ${totalCount} images`,
            results: results
        };
    }

    async addImage(imageData: AppImageData, buffer: Buffer) {
        await localImageStorage.writeImage(imageData.imagePath, buffer);
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
            let imageGroups = (await ImageModel.getImageById(imageId)).group;
            if(imageGroups.indexOf(groupId) !== -1){
                throw Error("group already exists on image");
            }

            imageGroups.push(groupId);
            const results = await ImageModel.updateImage(imageId, "group", imageGroups);

            return{
                success: results.success,
                message: "group added to " + results.document?._id
            }
        } catch (error: any) {
            return{
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Process a new image upload.
     * Saves image to disk and inserts metadata into database.
     * Thumbnail generation and prompt extraction are deferred to the background task queue
     * (imageProcessor.processAllImages()) to avoid blocking the upload response.
     */
    async newImage(file: imgFile, uniqueID: string) {
        // Read file into buffer for hashing and storage
        let buffer = Buffer.from(await file.arrayBuffer());
        let hash = await FileModel.hashFile(buffer);

        if (await ImageModel.uniqueHash(hash) > 0) { // check if duplicate _id: hash; prevents duplicate images from being inserted
            console.log(`Image already exists. _id:${hash} file.name:${file.name}`)
            console.log(hash);
            return null;
        }

        const supportedVideo = ["mp4", "webm"];
        let ext = file.name.split('.').pop() ?? "";
        let newFileName = `${uniqueID}.${ext}`;

        let type: "image" | "video" = supportedVideo.includes(ext) ? "video" : "image"

        const imageDataObj: AppImageData = {
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

        try {
            // Save image to disk and insert metadata into database
            // Thumbnail/prompt work is deferred to background processor
            const dbResults = await this.addImage(imageDataObj, buffer);

            // Release buffer reference to allow GC to reclaim memory
            // Image is now safely on disk, buffer is no longer needed
            buffer = Buffer.alloc(0);

            return dbResults;
        } catch (error: any) {}
    }

    async updateAllThumbnails() {
        const total = await ImageModel.countAllImages();
        const page = total / 500;
        for (let i = 0; i < page; i++){
            const images = await ImageModel.findImages({}, 500, i * 500);
            for (let j = 0; j < images.length; j++){
                const imageData = images[j];
                const buffer = await FileModel.read(imageData.imagePath);
                await localImageProcessing.createThumbnail(imageData, buffer);
            }
        }
    }

    async updateMissingThumbnails() {
        const images = await ImageModel.findImages({thumbnailPath: ''});
        for (let i = 0; i < images.length; i++){
            const imageData = images[i];
            const buffer = await FileModel.read(imageData.imagePath);
            await localImageProcessing.createThumbnail(imageData, buffer);
        }
    }

}

export default new ImageController(constDefaultPath);
