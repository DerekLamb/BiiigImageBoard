import { ObjectId, type Sort, type Collection } from "mongodb";
import { type BaseImage, imageCollection } from "./unifiedModel";
import { databaseDocUtil as dbUtil} from "$lib/server/utility/dbUtil";
import { createMongoCollection } from "../collectionLayer";

const imageCollectionTest = createMongoCollection(imageCollection)

interface ImageDoc extends BaseImage { // 
    _id: ObjectId;
}

export interface AppImageData extends BaseImage {
    _id: string,
}
 
function toClient(document: ImageDoc) {
    return dbUtil.convertIdToString(document); // Convert ObjectId to string
}

function toDatabase(document: Partial<AppImageData>) {
    return dbUtil.convertStringToId(document);
}

export const ImageModel = {
    async findImages(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await imageCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray() as ImageDoc[];  
        return documents.map(toClient);
    },

    async getImageById(id: string) {
        const document = await imageCollectionTest.findOne({_id: id}) as ImageDoc;
        return document ;
    },

    async getImageByTimestamp(timestamp: string) {
        const document = await imageCollection.findOne({ uploadDate: timestamp }) as ImageDoc;
        return toClient(document);
    },

    async addImage(imageData: AppImageData) {
        return await imageCollection.insertOne(toDatabase(imageData)); 
    },

    async updateImage <ImageProp extends keyof AppImageData> (id: string, prop: ImageProp, value: AppImageData[ImageProp]) {
        let updates = { $set: { [prop]: value }} 
        return await imageCollection.updateOne({ _id: new ObjectId(id) }, updates);
    },

    async replaceImage(imageData: AppImageData) {
        const document = toDatabase(imageData);
        return await imageCollection.replaceOne({_id: document._id}, document);
    },

    async deleteImage(id: string) {
        return await imageCollection.deleteOne({ _id: new ObjectId(id) });
    },

    async countImages(filter = {}) {
        return await imageCollection.estimatedDocumentCount(filter);
    },

    async getAdjacents(key: keyof AppImageData, value: string | string[] | string [][],) { // CAUTION, this requires an index on the used key field for results to be consistent and performant
        const prevFilter = { [key]: { $lt: value } };
        const nextFilter = { [key]: { $gt: value } };
        
        const prev = await imageCollection.findOne(
            prevFilter, 
            { sort: { [key]: -1 } }) as ImageDoc;

        const prevImage = prev ? toClient(prev) : null;

        const next = await imageCollection.findOne(
            nextFilter, 
            { sort: { [key]: 1 } }) as ImageDoc;

        const nextImage = next ? toClient(next) : null;
        return { prev: prevImage, next: nextImage};
        },

    async repairImageDoc(id: string) {
        return 0; //todo later
        // obj = {currName = "", oldNames = [] }
        // if properties.map( in oldNames, change to newName. Break on err if multiple found )
                
    }
}
