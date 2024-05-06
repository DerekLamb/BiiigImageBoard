import { collections, db } from "$lib/db";

export const TagModel = {
    async getAll() {
        let tags =  await db.collection(collections.images).distinct("tags");
        let filtered = tags.filter(tag => tag);
        console.log("tags: ", filtered);
        return filtered;
    }
}