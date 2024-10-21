import { GroupModel } from "../models/groupModel";
import type { AppGroup } from "$lib/customTypes/DocTypes"

class GroupController {
    constructor() {

    }

    async getGroup(){
        return false;
    }

    async getGroupPage(params: {page: number, length: number, search?: string, sort?: string}){
        const search = params.search || '';
        const filter =  search ? { tags: { $regex: search, $options: 'i' }} : {};
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        
        const Groups = await GroupModel.findGroups(filter, length, skip, sort);

        return Groups
    }

    async getGroupCount(){
        return 20
    }

    async ensureGroup(groupData: AppGroup) {
        const existingGroup = await GroupModel.getGroupById(groupData._id);

        if(!existingGroup){
            return await GroupModel.createGroup(groupData);
        }
        else {
            console.log(groupData._id ,", ", groupData.name, "already exists");
            return false;
        }
    }

    async updateGroup(groupData: AppGroup) {
        return GroupModel.updateGroup(groupData._id, groupData);

    }

    async addImageToGroup(groupId: string, imageId: string){
        return GroupModel.addImageToGroup(groupId, imageId);
    }
}

export const groupController = new GroupController()
