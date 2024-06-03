import { ObjectId, type Sort } from 'mongodb';
import { imageCollection,
        groupCollection,
        type AppGroupData,
        type GroupDoc } from "$lib/server/types";


function toClient(document: GroupDoc): AppGroupData { 
    const id = document._id.toString();
    let children = document.children.map((child) => { return child.toString() });
    return { ...document, _id: id} as AppGroupData; // Convert ObjectId to string
}

function toDatabase(document: Partial<AppGroupData>): GroupDoc {
    const id = new ObjectId(document._id);
    return { ...document, _id: id } as GroupDoc; // Convert string to ObjectId
}

export const GroupModel = {
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray() as GroupDoc[];  
        return documents.map(toClient);
    },

    async getGroupById(id: string) {
        const document = await groupCollection.findOne({ _id: new ObjectId(id) }) as GroupDoc;
        return toClient(document);
    },

    async getGroupByName(name: string) {
        const document = await groupCollection.findOne({ name: name }) as GroupDoc;
        return toClient(document);
    },

    async createGroup(groupData: Partial<AppGroupData>) {
        let result =  await groupCollection.insertOne(toDatabase(groupData), {}); 
        return result;
    },

    async addDocToGroup(groupId: string, docId: string) {
        const group = await GroupModel.getGroupById(groupId);
        const childImages = await imageCollection.find({_id: {$in: group.children}}).toArray(); // replace with AggregateModel.findAggregated
        console.log(childImages);

        let latestDate: string = Date.now().toString();
        // childImages.forEach(async (image) => {
        //     if (latestDate === undefined) {
        //         latestDate = image.uploadDate;
        //     } else if (image.uploadDate > latestDate) {
        //         latestDate = image.uploadDate;
        //     }
        // })
        console.log(latestDate);
        await groupCollection.updateOne({ _id: new ObjectId(groupId) }, { $set: { uploadDate: latestDate } });
        return await groupCollection.updateOne({ _id: new ObjectId(groupId) }, { $push: { children: new ObjectId(docId) } });
    },

    async updateGroup(id: string, updates: Partial<AppGroupData>) {
        return await groupCollection.updateOne({ _id: new ObjectId(id) }, { $set: toDatabase(updates) });
    },

    async deleteGroup(id: string) {
        return await groupCollection.deleteOne({ _id: new ObjectId(id) });
    },
}