import { collections, db } from "$lib/db";
import { Collection , ObjectId } from "mongodb";

const imageCollection : Collection<ImageDoc> = db.collection(collections.images);


export const TagModel = {
    async getAll() {
        let tags =  await imageCollection.distinct("tags");
        let filtered = tags.filter(tag => tag);
        return filtered;
    }
}