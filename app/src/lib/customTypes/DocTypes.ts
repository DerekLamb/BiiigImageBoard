import type { ObjectId } from "mongodb";




interface BaseDoc {
    name: string;
    uploadDate: string,
}

export interface BaseGroup extends BaseDoc {
    name: string, // name of group
    type: 'group',
    uploadDate: string, // date group was created
    children: string[], // contains the ids of imageDoc or other GroupDoc(s), will need to handle making sure only goes three levels deep for groups
    thumbnailPaths?: string[], //thumbnail of children 
    group: string[], // needs considerations 
    groupType: string, // possible extension, unsure what to use for now
    groupTags: string[], // tags for the group 
    depth?: number,
}


export interface BaseImage { // should extend BaseDoc
    type: 'image',
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath?: string; 
    group: string[];
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