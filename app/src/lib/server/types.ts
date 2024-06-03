import { db, collections } from "$lib/db";
import type { Collection, ObjectId } from "mongodb";



export const imageCollection: Collection<ImageDoc> = db.collection(collections.images);
export const groupCollection: Collection<GroupDoc> = db.collection(collections.groups);

export interface BaseImage {
    type: "image";
    name: string;
    uploadDate: string;
    sanitizedFilename: string;
    imagePath: string;
    thumbnailPath: string; //thumbnail exists as path to file
    groups: string[];
    tags: string[];
    embPrompt?: string[][]; //needs 2b fleshed out
    related?: string[];
    favorite?: boolean;
    hidden?: boolean;
}

export interface ImageDoc extends BaseImage {
    _id: ObjectId;
}

export interface AppImageData extends BaseImage {
    _id: string;
}

export interface BasicGroup {
    type: "group";
    name: string; 
    uploadDate: string; 
    groups: string[]; 
    groupTags: string[]; 
}

export interface GroupDoc extends BasicGroup {
    _id: ObjectId;
    children: ObjectId[];
}
export interface AppGroupData extends BasicGroup {
    _id: string;
    children: string[];
}

