import { ObjectId, type Collection, type Sort } from "mongodb";
import { collections, imageCollection } from "$lib/db.server";

import { databaseDocUtil  as dbUtil } from "$lib/server/utility/dbUtil";
import { GroupModel } from "$lib/server/models/groupModel";


export const UnifiedModel = {
    
    async getDocumentById(id: string){
        let document = false; //TODO
    },

    async findNodeChildren(groupName: string = "", limit = 10, skip = 0, sort = { uploadDate: -1}) {
        let processedDocuments

        if(groupName == "" || groupName == null) {
            processedDocuments = await this.getBaseNodeChildren(limit, skip, sort)
        }
        else {
            processedDocuments = await GroupModel.getGroupByName(groupName)
        }
            
        return processedDocuments;
    },

    async getBaseNodeChildren( limit = 10,  skip = 0, sort = { uploadDate: -1 } ) {
        return await this.getNodeByGroupName("", limit, skip, sort);
    },

    async getNodeByGroupName(groupName = "", limit = 10,  skip = 0, sort = { uploadDate: -1 } ) {

        const matchStage = groupName ? { $match: { group: groupName } } : { $match: { group: [] } }

        const topLevel = imageCollection.aggregate([
            {
                $unionWith: {
                    coll: collections.groups,
                    pipeline: [ matchStage]
                }
            },
            matchStage,  
            { $sort: sort },
            { $skip: skip },  
            { $limit: limit }
        ])
        let aggArr = await topLevel.toArray()
        const processedDocuments = aggArr.map(dbUtil.convertIdToString);
        return processedDocuments;
    }
}

