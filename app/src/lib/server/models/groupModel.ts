import { ObjectId, type Sort } from 'mongodb';
import { imageCollection, groupCollection, } from '$lib/server/models/unifiedModel'
import type { AppGroup, GroupDoc } from '$lib/customTypes/DocTypes';
import { databaseDocUtil as dbUtil} from "$lib/server/utility/dbUtil";


function toClient(document: GroupDoc): AppGroup { 
    return dbUtil.convertIdToString(document) as AppGroup; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppGroup>): GroupDoc {
    return dbUtil.convertStringToId(document) as GroupDoc; // Convert string to ObjectId
}

export const GroupModel = { 
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();  

        return documents.map(dbUtil.convertIdToString) as AppGroup[];
    },

    async getGroupById(id: string) {
        const document = await groupCollection.findOne({ _id: new ObjectId(id) }) as GroupDoc;
        return dbUtil.convertIdToString(document);
    },

    async getGroupByName(name: string) {
        const document = await groupCollection.findOne({ name }) as GroupDoc;
        if(!document) {
            return false;
        }
        return dbUtil.convertIdToString(document);
    },

    async getGroupChildren(groupName, page, limit, sort = { uploadDate: -1}){
        const documents = await groupCollection.findOne({ name: groupName });
        if(documents.hasOwnProperty(children)){
            documents.children.map(dbUtil.convertIdToString);
            // does this work?? TODO 
        }
    },

    async createGroup(groupData: Partial<AppGroup>) {

        let modifiedGroupData = {...groupData, _id : new ObjectId()} as GroupDoc;

        return await groupCollection.insertOne(modifiedGroupData); 
    },

    async addImageToGroup(groupId: string, imageId: string) {
        const group = await GroupModel.getGroupById(groupId);
        const childImages = await imageCollection.find({_id: {$in: group.children}}).toArray();
        console.log(childImages);

        const latestDate = childImages.reduce((latest, image) => image.uploadDate > latest ? image.uploadDate : latest, "0");

        return await groupCollection.updateOne(
            { _id: new ObjectId(groupId) }, 
            { 
                $set: { uploadDate: latestDate },
                $push: { children: new ObjectId(imageId) }
            }
        );
    },

    async updateGroup(id: string, updates: Partial<AppGroup>) {
        return await groupCollection.updateOne({ _id: new ObjectId(id) }, { $set: toDatabase(updates) });
    },

    async deleteGroup(id: string) {
        return await groupCollection.deleteOne({ _id: new ObjectId(id) });
    },

    async getGroupCount(filter = {}) {
        return await groupCollection.estimatedDocumentCount(filter);
    },
}