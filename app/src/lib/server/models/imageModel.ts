import { ObjectId } from "mongodb";
import { collections, db } from "$lib/db";


const imageCollection = db.collection(collections.images);

export interface ImageData {
    _id?: ObjectId | string,
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string;
    tags: string[] | null;
    embPrompt?: string[][] | null;
    related?: string[] | null;
    favorite?: string[] | null;
    hidden?: string[] | null;
}

function toClient(document: ImageData): ImageData {
    if (document._id) {
        document._id = document._id.toString(); // Convert ObjectId to string
    }
    return document;
}

function toDatabase(document: ImageData): ImageData {
    if (document._id && typeof document._id === 'string') {
        document._id = new ObjectId(document._id); // Convert string back to ObjectId
    }
    return document;
}


export const ImageModel = {
    async findImages(filter = {}, limit = 10, skip = 0) {
        const documents = await imageCollection.find(filter).skip(skip).limit(limit).toArray();
        return documents.map(toClient);
    },

    async getImageById(id: string) {
        const document = await imageCollection.findOne({ _id: new ObjectId(id) });
        return document;
    },

    async addImage(imageData: ImageData) {
        imageData = toDatabase(imageData);
        return await imageCollection.insertOne(imageData);
    },

    async updateImage(id: string, updates: Partial<ImageData>) {
        updates = toDatabase(updates);
        return await imageCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    },

    async deleteImage(id: string) {
        return await imageCollection.deleteOne({ _id: new ObjectId(id) });
    }
};