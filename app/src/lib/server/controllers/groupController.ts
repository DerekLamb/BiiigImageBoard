import { GroupModel } from "$lib/server/models/groupModel";
import type { AppGroup } from "$lib/types/DocTypes"
import { ImageModel } from "../models/imageModel";

class GroupController {
    // Default values for group creation
    private defaultGroupData: Partial<AppGroup> = {
        type: 'group',
        uploadDate: Date.now().toString(),
        children: [],
        group: [],
        groupType: 'default',
        groupTags: []
    };

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
        
        const Groups = await GroupModel.findGroups({}, length, skip, sort);

        return Groups
    }

    async getAllGroups(){
        const Groups = await GroupModel.getAllGroups()
        return Groups
    }

    async getGroupCount(){
        return GroupModel.getGroupCount();
    }

    async ensureGroup(partialGroupData: Partial<AppGroup>) {
        // Merge partial data with defaults
        const groupData = { ...this.defaultGroupData, ...partialGroupData };
        
        if(!groupData.name) {
            throw Error("Group name not provided for creation")
        }

        const existingGroup = await GroupModel.getGroupByName(groupData.name);

        if(!existingGroup){
            const results = await GroupModel.createGroup(groupData);
            if(groupData.children && groupData.children.length > 0){
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

    async createGroup(partialGroupData: Partial<AppGroup>) {
        // Merge partial data with defaults
        const groupData = { ...this.defaultGroupData, ...partialGroupData };
        
        if(!groupData.name) {
            groupData.name = Date.now().toString();
        }

        const results = await GroupModel.createGroup(groupData);
        
        if(groupData.children && groupData.children.length > 0){
            groupData.children.forEach( e => {ImageModel.updateImage(e, "group", [results.id])})
        }
        
        GroupModel.updateGroupThumbnail(results.id);
        return results;
    }

    async updateGroup(groupId: string, partialGroupData: Partial<AppGroup>) {
        return GroupModel.updateGroup(groupId, partialGroupData);
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

    async deleteGroup(groupId: string) {
        const results = await GroupModel.deleteGroup(groupId)

        return {
            success: results.success,
            id: results.id,
            count: results.count,
        }
    }
}

export const groupController = new GroupController()