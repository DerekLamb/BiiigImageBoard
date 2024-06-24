import { ObjectId, type Sort } from 'mongodb';
import { imageCollection,
        groupCollection,
        type AppGroupData,
        type GroupDoc } from "$lib/server/types";

function toClient(document: GroupDoc): AppGroupData { 
    const id = document._id.toString();
    return { ...document, _id: id} as AppGroupData; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppGroupData>): GroupDoc {
    if( !document._id || !ObjectId.isValid(document._id)) throw new Error("Invalid ObjectId")
    const id = new ObjectId(document._id);
    return { ...document, _id: id } as GroupDoc; // Convert string to ObjectId
}

export const GroupModel = {
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray() as GroupDoc[];  
        return documents.map(toClient);
    },

    async getGroupById(id: string) {
        if( !ObjectId.isValid(id) ) throw new Error("Invalid ObjectId");
        const document = await groupCollection.findOne({ _id: new ObjectId(id) }) as GroupDoc;
        if(!document){
            console.log("No group found with id: " + id);
            return {};
        };
        return toClient(document);
    },

    async getGroupByName(name: string) {
        const document = await groupCollection.findOne({ name: name }) as GroupDoc;
        if(!document){
            console.log("No group found with name: " + name);
            return null;
        };
        return toClient(document);
    },

    async createGroup(groupData: Partial<AppGroupData>) {
        if(!groupData._id){
            groupData._id = new ObjectId().toString();
        }
        let result =  await groupCollection.insertOne(toDatabase(groupData)); 
        return result;
    },

    async addDocToCurrent(groupId: string, docId: string) { // adds a document id as string to the children array of a group
        console.log("here be gragons: ", groupId, docId)
        const group = await GroupModel.getGroupById(groupId);
        let latestDate: string = Date.now().toString();      
        await groupCollection.updateOne({ _id: new ObjectId(groupId) }, { $set: { uploadDate: latestDate } }); 
        return await groupCollection.updateOne({ _id: new ObjectId(groupId) }, { $addToSet: { children: docId } });
    },

    async addCurrentToGroup(groupId: string, childGroupId: string) { 
        return await groupCollection.updateOne({ _id: new ObjectId(groupId) }, { $push: { groups: childGroupId } });
    },

    async updateGroup(id: string, updates: Partial<AppGroupData>) {
        return await groupCollection.updateOne({ _id: new ObjectId(id) }, { $set: toDatabase(updates) });
    },

    async deleteGroup(id: string) {
        return await groupCollection.deleteOne({ _id: new ObjectId(id) });
    },
}