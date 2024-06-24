import { GroupModel } from "../models/groupModel";
import { ImageModel } from "../models/imageModel";
import { type AppGroupData } from "../types";

class GroupController {
    constructor() {}

    async getGroupById(id: string) {
        return GroupModel.getGroupById(id);
    }

    async getGroupByName(name: string) {
        return GroupModel.getGroupByName(name);

    }
    
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

        let groupData: Partial<AppGroupData> = {
            //_id handled by mongo supposedly.....
            type: 'group',
            name: name, 
            uploadDate: Date.now().toString(), 
            children: children || [],
            groups: [], 
            groupTags: []
        }
        let results = await GroupModel.createGroup(groupData);

        if(results.insertedId) {
            console.log("Group created: ", results.insertedId.toString());
            return results.insertedId.toString();
        } else {
            throw new Error("Error creating group"); 
        }
    }

    async addToGroup(groupId: string, documentId: string, type: "image" | "group") {
        await GroupModel.addDocToCurrent(groupId, documentId);
        try {
            if(type === 'image') {
                await ImageModel.updateArrayPropertyImage(documentId, "groups", groupId);
            } else if (type === 'group') { 
                await GroupModel.addCurrentToGroup(documentId, groupId)
            }
        } catch (error) {
            throw new Error("Error adding document to group");
        }

        return 1
    }

    async updateGroup(groupId: string, updates: Partial<AppGroupData>) {
        return await GroupModel.updateGroup(groupId, updates);
    }
}

export default new GroupController();