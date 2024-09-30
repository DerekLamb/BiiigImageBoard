import { ObjectId, type Sort } from 'mongodb';
import { imageCollection, groupCollection, } from '$lib/server/models/unifiedModel'
import type { AppGroup, GroupDoc  } from '$lib/customTypes/DocTypes';



function toClient(document: GroupDoc): AppGroup { 
    const id = document._id.toString();
    return { ...document, _id: id } as AppGroup; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppGroup>): GroupDoc {
    const id = new ObjectId(document._id);
    return { ...document, _id: id } as GroupDoc; // Convert string to ObjectId
}

export const GroupModel = { 
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray() as GroupDoc[];  

        return documents.map(toClient);
    },

    async getGroupById(id: string) {
        const document = await groupCollection.findOne({ _id: new ObjectId(id) }) as GroupDoc;
        return toClient(document);
    },

    async getGroupByName(name: string) {
        const document = await groupCollection.findOne({ name }) as GroupDoc;
        return toClient(document);
    },

    async createGroup(groupData: Partial<AppGroup>) {
        return await groupCollection.insertOne(toDatabase(groupData)); 
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
}