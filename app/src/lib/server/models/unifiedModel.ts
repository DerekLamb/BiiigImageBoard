import { ObjectId, type Collection } from "mongodb";
import { collections, db } from "$lib/db";


export const imageCollection : Collection<ImageDoc> = db.collection(collections.images);
export const groupCollection : Collection<GroupDoc> = db.collection(collections.groups);

export interface BaseImage { // This is the interface for the image/group data that is stored in the database
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

interface GroupDoc extends BasicGroup {
    _id: ObjectId;
}

export interface BasicGroup {
    name: string, // name of group
    uploadDate: string, // date group was created
    children: ObjectId[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    groups: ObjectId[], // needs considerations 
    groupType: string, // possible extension, unsure what to use for now
    groupTags: string[], // tags for the group
}


// Group + Image Aggregation functions 


//aggregation + pagination example to get all top level images + groups 

// function displayGroupLevel( group: AppGroupData ) {

// }
// const topLevel = imageCollection.aggregate([
//     {
//         $unionWith: {
//             coll: collections.groups,
//             pipeline: [ {$match: { groups: [] } }]
//         }
//     },
//     { $match: { groups: [] } },  // Only include top-level folders
//     { $sort: { uploadDate: -1  } },  // Sort by name or other criteria
//     { $skip: 0 },  // Pagination offset, calculate based on current page
//     { $limit: 10 }  // Number of items per page
// ])


