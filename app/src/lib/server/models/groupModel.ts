
import { ObjectId, type Sort } from 'mongodb';
import { collections, db} from "$lib/db";

const groupCollection = db.collection(collections.groups);

interface BaseImage{ 
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string;
    tags: string[];
    groups: string[]; // groups image is a member of
    embPrompt?: string[][];
    related?: string[];
    favorite?: string[];
    hidden?: string[];

}

interface ImageDoc extends BaseImage { 
    _id: ObjectId;
}

interface BasicGroup {
    name:string, // name of group
    children: ObjectId[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    groups: ObjectId[], // contians the groups this group is a member of : Add check to make sure it is only one level deep
    groupType: string, // possible extension, unsure what to use for now
    groupTags: string[], // tags for the group
}

interface GroupDoc extends BasicGroup {
    _id: ObjectId;
}

export interface AppGroupData extends BasicGroup {
    _id: string,
}

function toClient(document: GroupDoc): AppGroupData {
    const id = document._id.toString();
    return { ...document, _id: id } as AppGroupData; // Convert ObjectId to string
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
}