import { ObjectId, type Collection } from "mongodb";
import { collections, db } from "$lib/db";





export const imageCollection : Collection<ImageDoc> = db.collection(collections.images);
export const groupCollection : Collection<GroupDoc> = db.collection(collections.groups);

export interface BaseImage { // This is the interface for the image/group data that is stored in the database
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string; //thumbnail exists as path to file
    groups: string[];
    tags: string[];
    embPrompt?: string[][]; //needs 2b fleshed out
    related?: string[]; 
    favorite?: string[];
    hidden?: string[];
}

export interface BasicGroup {
    name: string, // name of group
    uploadDate: string, // date group was created
    children: ObjectId[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    groups: ObjectId[], // needs considerations 
    groupType: string, // possible extension, unsure what to use for now
    groupTags: string[], // tags for the group 
}

export interface BaseDoc {
    name: string;
    filePath: string;
    createDate: string;
    thumbnailPath: string;
    groups: string[];
    tags: string[];
}

interface GroupDoc extends BasicGroup {
    _id: ObjectId;
}

interface ImageDoc extends BaseImage { // 
    _id: ObjectId;
}

function toClient(document: ImageDoc): AppImageData {

}


export const UnifiedModel = {

    async getChildren(groupName: string = "", page = 0, limit = 10) { //used to get children of a group
        const skip = page * limit;

        imageCollection.updateMany(
            {},
            { 
              $unset: { groups: "" },
              $set: { group: [] }
            }
          )

        const topLevel = imageCollection.aggregate([
            {
                $unionWith: {
                    coll: collections.groups,
                    pipeline: [ { $match: { groups: [] } }]
                }
            },
            { $match: { group: [] } },  // Only include top-level folders when empty
            { $sort: { uploadDate: -1  } },  // Sort by name or other criteria
            { $skip: skip },  // Pagination offset, calculate based on current page
            { $limit: limit }  // Number of items per page
        ])

        let aggArr = await topLevel.toArray()
        const processedDocuments = aggArr.map(document => {
            const { _id, ...rest } = document;
            return {
                ...rest,
                _id: _id.toString()
            };
        });

        return processedDocuments;
    }
}

