import { ObjectId, type Sort, type Collection } from "mongodb";
import { collections, db } from "$lib/db";


const imageCollection : Collection<ImageDoc> = db.collection(collections.images);

interface BaseImage{ // This is the interface for the image data that is stored in the database
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string;
    groups: string[];
    tags: string[];
    embPrompt?: string[][]; //needs fleshed out
    related?: string[]; 
    favorite?: string[];
    hidden?: string[];
}

interface ImageDoc extends BaseImage { // 
    _id: ObjectId;
}

export interface AppImageData extends BaseImage {
    _id: string,
}

 

function toClient(document: ImageDoc): AppImageData {
    const id = document._id.toString();
    return { ...document, _id: id } as AppImageData; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppImageData>): ImageDoc {
    const id = new ObjectId(document._id);
    return { ...document, _id: id } as ImageDoc; // Convert string to ObjectId
}


export const ImageModel = {
    async findImages(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await imageCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray() as ImageDoc[];  
        return documents.map(toClient);
    },

    async getImageById(id: string) {
        const document = await imageCollection.findOne({ _id: new ObjectId(id) }) as ImageDoc;
        return toClient(document);
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

    async getAdjacents(key: keyof AppImageData, value: string | string[] | string [][],) { // caution, this requires an index on the used key field for results to be consistent
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
        return { prev: prevImage || null, next: nextImage};
        },
}
