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


/**
 * Structured embedded prompt data extracted from image metadata.
 * Supports A1111, CivitAI, and ComfyUI formats.
 */
export interface EmbeddedPrompt {
    /** Source format: 'a1111' | 'civitai' | 'comfyui' | 'unknown' */
    source: string;
    /** Positive prompt terms/tags */
    positive: string[];
    /** Negative prompt terms/tags */
    negative: string[];
    /** Generation metadata (steps, sampler, CFG, etc.) */
    metadata: string[];
    /** Original raw prompt text for re-parsing or display */
    raw?: string;
}

export interface BaseImage { // should extend BaseDoc
    type: 'image' | 'video',
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath?: string;
    group: string[];
    tags: string[];
    /** Structured embedded prompt data from image metadata */
    embPrompt?: EmbeddedPrompt;
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