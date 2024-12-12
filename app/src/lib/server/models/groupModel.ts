import { ObjectId, type Sort } from 'mongodb';
import { imageCollection, groupCollection, } from '$lib/server/models/unifiedModel'
import type { AppGroup, GroupDoc } from '$lib/customTypes/DocTypes';
import { databaseDocUtil as dbUtil} from "$lib/server/utility/dbUtil";
import { createMongoCollection  } from '$lib/server/collectionLayer';

const groupColl = createMongoCollection(groupCollection);

export const GroupModel = { 
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupColl.findPage(filter, limit, skip, sort);
        return documents as AppGroup[];
    },

    async getGroupById(id: string) {
        const document = await groupColl.findOne({ _id:id }) as GroupDoc;
        return document;
    },

    async getGroupByName(name: string) {
        const document = await groupColl.findOne({ name }) as GroupDoc | null;
        return document
    },

    async getAllGroups() {
        const documents = await groupColl.find();
        return documents
    },

    async createGroup(groupData: Partial<AppGroup>) {
        const result = await groupColl.insertOne(groupData); 
        return result
    },

    async addImageToGroup(groupId: string, imageId: string) {
        const parentGroup = await GroupModel.getGroupById(groupId);
        const childImages = await imageCollection.find( { _id: { $in: parentGroup.children }} ).toArray();
        console.log(childImages);

        const latestDate = childImages.reduce((latest, image) => image.uploadDate > latest ? image.uploadDate : latest, "0");

        return await groupColl.updateOne(
            { _id: new ObjectId(groupId) }, 
            { 
                $set: { uploadDate: latestDate },
                $push: { children: new ObjectId(imageId) }
            }
        );
    },

    async updateGroup(id: string, updates: Partial<AppGroup>) {
        return await groupColl.updateOne({ _id: id }, { $set: updates });
    },

    async deleteGroup(id: string) {
        return await groupColl.deleteOne({ _id: id });
    },

    async getGroupCount() {
        return await groupColl.estimateDocumentCount();
    },
}