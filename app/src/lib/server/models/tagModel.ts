import { collections, db } from "$lib/db";
import { Collection , ObjectId } from "mongodb";

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

export const TagModel = {
    async getAll() {
        let tags =  await imageCollection.distinct("tags");
        let filtered = tags.filter(tag => tag);
        return filtered;
    }
}