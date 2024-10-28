import { ObjectId, type Collection, type Sort } from "mongodb";
import { collections, db } from "$lib/db.server";

import { databaseDocUtil  as dbUtil } from "$lib/server/utility/dbUtil";
import { GroupModel } from "$lib/server/models/groupModel";

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
    children: string[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    groups: string[], // needs considerations 
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
    type: "image" | "group";
}

interface GroupDoc extends BasicGroup {
    _id: ObjectId;
}

interface ImageDoc extends BaseImage { // 
    _id: ObjectId;
}


export const UnifiedModel = {

    async findNodeChildren(groupName: string = "", limit = 10, skip = 0, sort = { uploadDate: -1}) { //used to get children of a group/node
        let processedDocuments

        if(groupName == "" || groupName == null) {
            processedDocuments = await this.getBaseNodeChildren( limit, skip, sort)
        }
        else {
            processedDocuments = await GroupModel.getGroupByName(groupName)
        }
            
        return processedDocuments;
    },

    async getBaseNodeChildren( limit = 10,  skip = 0, sort = { uploadDate: -1 } ) {


        const topLevel = imageCollection.aggregate([
            {
                $unionWith: {
                    coll: collections.groups,
                    pipeline: [ { $match: { group: [] } }]
                }
            },
            { $match: { group: [] } },  
            { $sort: sort },
            { $skip: skip },  // Pagination offset, calculate based on current page
            { $limit: limit }  // Number of items per page
        ])
        let aggArr = await topLevel.toArray()
        const processedDocuments = aggArr.map(dbUtil.convertIdToString);
        return processedDocuments;
    }
}

