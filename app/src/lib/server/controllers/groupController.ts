import { GroupModel } from "$lib/server/models/groupModel";
import type { AppGroup } from "$lib/customTypes/DocTypes"
import { ImageModel } from "../models/imageModel";

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

    async ensureGroup(groupData: Partial<AppGroup>) {
        if(!groupData.name) {
            throw Error("Group name not provided for creation")
        }

        const existingGroup = await GroupModel.getGroupByName(groupData.name);

        if(!existingGroup){
            const results = await GroupModel.createGroup(groupData);
            if(groupData.children){
                groupData.children.forEach( e => {ImageModel.updateImage(e, "group", [results.id])})
            }
            GroupModel.updateGroupThumbnail(results.id);
            return results;
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
        const results = await GroupModel.addImageToGroup(groupId, imageId);
        if( results.success === true ){
            const thmbResults = await GroupModel.updateGroupThumbnail(groupId);
            ImageModel.updateImage(imageId, "group", [groupId]);
            if(thmbResults.success === false){
                return {
                    success: thmbResults.success,
                    message: thmbResults.message
                }
            }
        }
    }
}

export const groupController = new GroupController()
