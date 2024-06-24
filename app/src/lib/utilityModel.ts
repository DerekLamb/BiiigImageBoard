import {v4 as uuidv4} from "uuid";

export function groupNameGenerator() {
    let groupName = "Group" + uuidv4().slice(0, 6);
    return groupName;
}