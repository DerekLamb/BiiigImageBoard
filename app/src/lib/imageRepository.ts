import { ObjectId, Collection, type WithId } from "mongodb"
import db from '$lib/db'
import txtToSearchParam from "./SearchTxtToFilter";
import type Image from "./image.svelte";


interface ImageData {
    _id?: ObjectId,
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string | null;
    embPrompts: string[] | null;
    tags: string[] | null;
    embPrompt?: string[][] | null;
    related?: string[] | null;
}

class ImageRepository {
    private collection: Collection;
    
    constructor(collectionName: string){
        this.collection = db.collection(collectionName);
    }

    async getById(id: string): Promise <ImageData | null> {
        return this.collection.findOne({ _id: new ObjectId(id) }) as Promise<ImageData>;
    }

    async getByFileName(fileName: string): Promise <ImageData | null> {
        return this.collection.findOne({ sanitizedFilename: fileName }) as Promise<ImageData>;
    }

    async getByTimestamp(timestamp: string): Promise <ImageData | null> {
        return this.collection.findOne({ uploadDate: timestamp }) as Promise<ImageData>;
    }

    async get(filter = {}): Promise <ImageData[]> {
        //default returns everything
        return this.collection.find(filter).toArray() as Promise<ImageData[]>;
    }

    async getPage(currPage:number, pageLength:number, tagSearch? : string[], sort?: {}): Promise<ImageData[]> {
        const startInd = (currPage - 1) * pageLength;
        const imageFilter = tagSearch ? txtToSearchParam(tagSearch[0]) : {};

        const images = await this.collection
        .find(imageFilter)
        .sort({ uploadDate: -1 })
        .skip(startInd)
        .limit(pageLength)
        .toArray();

        return images as ImageData[];
    }
 
    async create(fileName:string, sanitizedFilename:string, timestamp: string, imagePath:string, thumbPath:string, fileHash:string): Promise<string | null>{
        const tags = null;
        const embPrompts = null;
        const imageData : ImageData = {
            _id: new ObjectId(fileHash),
            originalName: fileName,
            sanitizedFilename: sanitizedFilename,
            imagePath: `${imagePath}/${sanitizedFilename}`, 
            uploadDate: timestamp,
            thumbnailPath: thumbPath,
            embPrompts: embPrompts,
            tags: tags
        }

        try {
            await this.collection.insertOne(imageData)
            console.log(`File ${fileName} written to DB and filesystem`)
            return "written to DB"
        } catch (error) {
            console.log(`Error writing ${fileName} to DB`)
            return null
        }
    }

    async update(id: string, imageData: Partial<ImageData>): Promise<void> { // may need to recheck this... 
        await this.collection.updateOne({ _id: new ObjectId(id) }, {$set: imageData });
    }

    async updateByTimestamp(timestamp: string, imageData: Partial<ImageData>): Promise<void> { // may need to recheck this... 
        await this.collection.updateOne({ uploadDate: timestamp}, {$set: imageData });
    }

    async deleteFilename(filename: string){
        return this.collection.deleteOne({sanitizedFilename: filename})
    }

    async deleteByFileName(fileName: string): Promise<void> {
        await this.collection.deleteOne({ sanitizedFilename: fileName });
    }
}

const imageRepo : ImageRepository = new ImageRepository("testimages");

export {imageRepo, ImageRepository}
