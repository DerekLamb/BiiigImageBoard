import { GroupModel } from "../models/groupModel";
import type { AppGroup } from "$lib/customTypes/DocTypes"

class GroupController {
    constructor() {

    }

    async updateGroup(groupData: AppGroup) {
        const existingGroup = await GroupModel.getGroupById(groupData._id);

        if(!existingGroup){
            GroupModel.createGroup(groupData);
        }
        else {
            GroupModel.updateGroup(groupData._id, groupData);
        }
    }
}

export const groupModel = new GroupController();
