import { GroupModel } from "../models/groupModel";
import { ImageModel } from "../models/imageModel";
import { type AppGroupData } from "../types";
import { ObjectId } from 'mongodb';

class GroupController {
    constructor() {}
    
    async getGroupChildren(groupId: string, page: number, limit: number) {
        const length = limit;
        const skip = (page - 1) * length;
        const sort = 'uploadDate';
        const filter = { _id: groupId };
        const group = await GroupModel.getGroupById(groupId);
        const children = await GroupModel.findGroups(filter, length, skip, sort);
        return children;
    }

    async createGroup(name: string, children?: string[]) {

        let objIdChildren = children ? children.map((child) => { return new ObjectId(child) }) : [];

        let groupData: Partial<AppGroupData> = {
            //_id handled by mongo
            type: 'group',
            name: name, 
            uploadDate: Date.now().toString(), 
            children: objIdChildren,
            groups: [], 
            groupType: 'default', 
            groupTags: []
        }

        return await GroupModel.createGroup(groupData);
    }

    async addDocToGroup(groupId: string, documentId: string, type: "image" | "group") {
        await GroupModel.addDocToGroup(groupId, documentId);
        if(type === 'image') {
            await ImageModel.updateArrayPropertyImage(documentId, "groups", groupId);
        } else { 
            await GroupModel.updateGroup(documentId, { groups: groupId })
        }
        return await GroupModel.addDocToGroup(groupId, documentId);
    }

    async updateGroup(groupId: string, updates: Partial<AppGroupData>) {
        return await GroupModel.updateGroup(groupId, updates);
    }
}

export default new GroupController();