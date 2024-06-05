import { collections, db } from "$lib/db";
import { Collection , ObjectId } from "mongodb";
import { type BaseImage } from "$lib/server/types";

const imageCollection : Collection<ImageDoc> = db.collection(collections.images);

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