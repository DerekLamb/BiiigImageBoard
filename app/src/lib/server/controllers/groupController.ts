import { GroupModel } from "../models/groupModel";
import type { AppGroup } from "$lib/customTypes/DocTypes"

class GroupController {
    constructor() {

    }

    async getGroup(groupId: string){
        return GroupModel.getGroupById(groupId);
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

    async getAllGroups(){
        const Groups = await GroupModel.getAllGroups()
        return Groups
    }

    async getGroupCount(){
        return GroupModel.getGroupCount();
    }

    async ensureGroup(groupData: AppGroup) {
        const existingGroup = await GroupModel.getGroupByName(groupData.name);

        if(!existingGroup){
            return await GroupModel.createGroup(groupData);
        }
        else {
            console.log(groupData._id ,", ", groupData.name, "already exists"); 
            return existingGroup;
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
