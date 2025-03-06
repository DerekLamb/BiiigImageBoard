import { imageCollection } from "$lib/db.server";


export const TagModel = {
    async getAll() {
        let tags =  await imageCollection.distinct("tags");
        let filtered = tags.filter(tag => tag);
        return filtered;
    }
}