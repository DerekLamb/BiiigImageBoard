import { ObjectId, type Sort, } from "mongodb";
import { type BaseImage, type AppImage } from "$lib/types/DocTypes";
import { imageCollection } from "$lib/db.server"
import { createMongoCollection } from "../collectionLayer";

const imageColl = createMongoCollection(imageCollection)

interface ImageDoc extends BaseImage { // 
    _id: ObjectId;
}

export interface AppImageData extends BaseImage {
    _id: string,
}

export const ImageModel = {
    async findImages( filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 } ) {
        const documents = await imageColl.findPage(filter, limit, skip, sort);
        return documents as AppImageData[];
    },

    async getImageById( id: string ) {
        const document = await imageColl.findOne({_id: id}) as AppImageData;
        return document ;
    },

    async getImageByTimestamp( timestamp: string ) {
        const document = await imageColl.findOne({ uploadDate: timestamp }) as AppImageData;
        return document;
    },

    async addImage( imageData: AppImageData ) {
        const results = await imageColl.insertOne( imageData ); 
        return { 
            success: results.acknowledged === true,
            id: results.insertedId?.toString(),
            
        }
    },

    async updateImage <ImageProp extends keyof AppImageData> ( id: string, prop: ImageProp, value: AppImageData[ImageProp] ) {
        let updates = { $set: { [prop]: value }} 
        const results = await imageColl.updateOne({ _id: id }, updates ); 

        return {
            success: results !== null,
            document: results,
            modified: results !== null && results[prop] === value
        }
    },

    async replaceImage(imageData: AppImageData) {
        const document = imageData;
        const results =  await imageColl.replaceOne({_id: document._id}, document );

        return {
            success: results.acknowledged === true,
            id: results.upsertedId?.toString(),
            count: results.upsertedCount,
        }
    },

    async deleteImage(id: string) {
        const results = await imageColl.deleteOne({ _id: id });

        return {
            success: results.acknowledged === true,
            id: id,
            count: results.deletedCount
        }
    },

    async countAllImages() {
        return await imageColl.estimateDocumentCount();
    },

    async countFilteredImages(countFilter = {}){
        return await imageColl.countDocuments(countFilter);
    },

    async uniqueHash(id: string){
        return await imageColl.idExists(id)
    },

    async getAdjacents(key: keyof AppImageData, value: string | string[] | string [][],) { // CAUTION, this requires an index on the used key field for results to be consistent and performant
        const nextFilter = { [key]: { $lt: value } };
        const prevFilter = { [key]: { $gt: value } };
        
        const prev = await imageColl.findOne(
            prevFilter, 
            { sort: { [key]: 1 } }) as AppImageData;

        const prevImage = prev ?? null;

        const next = await imageColl.findOne(
            nextFilter, 
            { sort: { [key]: -1 } }) as AppImageData;

        const nextImage = next ?? null;
        return { prev: prevImage, next: nextImage};
        },

    async repairImageDoc(id: string) {
        return 0; //todo later
        // obj = {currName = "", oldNames = [] }
        // if properties.map( in oldNames, change to newName. Break on err if multiple found )
                    
    },

    async updateManyImages(imageIds: string[], updates: Partial<AppImage>) {
        const updatePromises = imageIds.map(id =>
            imageColl.updateOne({ _id: new ObjectId(id) }, { $set: updates })
        );
        await Promise.all(updatePromises);
        return { success: true, count: imageIds.length };
    },

    async deleteManyImages(imageIds: string[]) {
        const deletePromises = imageIds.map(id =>
            imageColl.deleteOne({ _id: new ObjectId(id) })
        );
        const results = await Promise.all(deletePromises);
        const deletedCount = results.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
        return { success: deletedCount === imageIds.length, deleted: deletedCount };
    },

    /** Get lightweight hash records for dedup scanning, with optional filter */
    async getAllHashes(filter: any = {}): Promise<Pick<AppImageData, '_id' | 'dhash' | 'uploadDate' | 'thumbnailPath' | 'originalName' | 'imagePath'>[]> {
        const results = await imageColl.find(filter, {
            projection: { _id: 1, dhash: 1, uploadDate: 1, thumbnailPath: 1, originalName: 1, imagePath: 1 }
        });
        return results as Pick<AppImageData, '_id' | 'dhash' | 'uploadDate' | 'thumbnailPath' | 'originalName' | 'imagePath'>[];
    },

    /** Get multiple images by their IDs */
    async getImagesByIds(ids: string[]): Promise<AppImageData[]> {
        const objectIds = ids.map(id => {
            try { return new ObjectId(id); } catch { return id; }
        });
        const results = await imageColl.find({ _id: { $in: objectIds } });
        return results as AppImageData[];
    }
}
