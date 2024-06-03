import { db, collections } from "$lib/db";
import type { Collection, ObjectId } from "mongodb";



export const imageCollection: Collection<ImageDoc> = db.collection(collections.images);
export const groupCollection: Collection<GroupDoc> = db.collection(collections.groups);

export interface BaseImage {
    type: "image";
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string; //thumbnail exists as path to file
    groups: string[];
    tags: string[];
    embPrompt?: string[][]; //needs 2b fleshed out
    related?: string[];
    favorite?: string[];
    hidden?: string[];
}

export interface ImageDoc extends BaseImage {
    _id: ObjectId;
}

export interface AppImageData extends BaseImage {
    _id: string;
}

export interface BasicGroup {
    type: "group";
    name: string; // name of group, used mainly for organization and display
    uploadDate: string; // date group was created
    groups: ObjectId[]; // needs considerations 
    groupTags: string[]; // tags for the group 
}

export interface GroupDoc extends BasicGroup {
    _id: ObjectId;
    children: ObjectId[];
}
export interface AppGroupData extends BasicGroup {
    _id: string;
    children: string[];
}

