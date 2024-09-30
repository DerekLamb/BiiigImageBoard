import type { ObjectId } from "mongodb";




interface BaseDoc {
    name: string;
    uploadDate: string,
}

export interface BaseGroup extends BaseDoc {
    name: string, // name of group
    uploadDate: string, // date group was created
    thumbnailPath: string;
    children: ObjectId[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    groups: ObjectId[], // needs considerations 
    groupType: string, // possible extension, unsure what to use for now
    groupTags: string[], // tags for the group 
}


export interface BaseImage { // should extend BaseDoc
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string; 
    groups: string[];
    tags: string[];
    embPrompt?: string[][]; //needs 2b fleshed out
    related?: string[]; 
    favorite?: string[];
    hidden?: string[];
}


export interface GroupDoc extends BaseGroup {
    _id: ObjectId;
}

export interface ImageDoc extends BaseImage { 
    _id: ObjectId;
}

export interface AppGroup extends BaseGroup {
    _id: string;
}

export interface AppImage extends BaseImage {
    _id: string;
}

export type AppContent = AppImage | AppGroup