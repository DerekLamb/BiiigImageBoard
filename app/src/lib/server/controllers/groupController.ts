import { GroupModel } from "../models/groupModel";
import type { AppGroup } from "$lib/customTypes/DocTypes"

class GroupController {
    constructor() {

    }

    async ensureGroup(groupData: AppGroup) {
        const existingGroup = await GroupModel.getGroupById(groupData._id);

        if(!existingGroup){
            GroupModel.createGroup(groupData);
        }
        else {
            GroupModel.updateGroup(groupData._id, groupData);
        }
    }

    async insertImage(groupId: string, imageId: string){
        return 0;
    }
}

export const groupModel = new GroupController();
