import type { ImageDoc, AppImageData, AppGroupData, GroupDoc } from "$lib/server/types";
import { groupCollection, imageCollection } from "$lib/server/types";
import { collections } from "$lib/db";
import { ObjectId, type Sort } from "mongodb";



function toClient(document: ImageDoc | GroupDoc): AppImageData | AppGroupData {
    console.log(document);
    const id = document._id.toString();
    return { ...document, _id: id } as AppImageData | AppGroupData; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppImageData>): ImageDoc | GroupDoc {
    const id = new ObjectId(document._id);
    return { ...document, _id: id } as ImageDoc | GroupDoc; // Convert string to ObjectId
}


export const AggregateModel = {

    async findAggregated(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1}) : Promise<(AppImageData | AppGroupData)[]>{ //used to get children of a group

        const topLevel = imageCollection.aggregate([
            {
                $unionWith: {
                    coll: collections.groups,
                    pipeline: [{$match: filter}]
                }
            },
            { $match: filter },  // Only include top-level folders when empty
            { $sort: { uploadDate: -1  } },  // Sort by name or other criteria
            { $skip: skip },  // Pagination offset, calculate based on current page
            { $limit: limit }  // Number of items per page
        ])

        let aggDocs =  await topLevel.toArray() as (ImageDoc | GroupDoc)[];
        console.log(aggDocs);
        let toClientDocs = aggDocs.map(toClient);
        return toClientDocs;
    }
    
} // type hell :3 