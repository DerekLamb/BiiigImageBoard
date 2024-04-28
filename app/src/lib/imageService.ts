import { ObjectId, type Collection } from 'mongodb';
import { collections } from '$lib/db';
import fs from 'fs/promises';
import { db } from '$lib/db';
import txtToSearchParam from './SearchTxtToFilter';
import sharp from 'sharp';
import crypto from 'crypto';

interface ImageAddr {
    id: string;
    imagePath: string;
    thumbnailPath: string; 
}

export interface ImageData {
    _id?: ObjectId,
    strId?: string, // for passing to client (Weird work around)
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string;
    tags: string[] | null;
    embPrompt?: string[][] | null;
    related?: string[] | null;
    favorite?: string[] | null;
    hidden?: string[] | null;
}

export class ImageAddrService { 
    constructor(private collection: Collection) {}

    async getImageAddr(id: string): Promise<ImageAddr | null> {
        try{
            const data = await this.collection.findOne({_id: new ObjectId(id)});
            if(!data) return null;
            return  {
                id: data._id.toString(),
                imagePath: data.imagePath,
                thumbnailPath: data.thumbnailPath
            }
        } catch(error) {
            throw new Error(`Error getting image address: ${error}`);
        }
    }

    async checkImageAddr(imageAddr: ImageAddr): Promise<boolean> { // want to improve this so it can be used by a script to check missing file access
        try {
            const data = await this.collection.findOne({_id: new ObjectId(imageAddr.id)});
            if(!data) return false;
            if(data.imagePath !== imageAddr.imagePath || data.thumbnailPath !== imageAddr.thumbnailPath) return false;
            try {
                await fs.access(imageAddr.imagePath); //will fail if file does not exist or not accessible
                await fs.access(imageAddr.thumbnailPath); //will fail if file does not exist or not accessible  
            } catch(error) {
                throw new Error(`image file ${error} not accessible`)
            }
            return true;
        } catch(error) {
            throw new Error(`Error confirming image address: ${error}`);
        }
    }
}

export class FileService {
    constructor() {}

    async getDir(dir : string): Promise<string[]> {
        try {
            return await fs.readdir(dir);
        } catch (error) {
            console.error(`Error getting directory: ${error}`);
            throw new Error(`Error getting directory: ${(error as Error).message}`);
        }
    }

    async getImage(imageData: ImageData): Promise<Buffer> {
        try {
            return await fs.readFile(imageData.imagePath);
        } catch (error) {
            console.error(`Error getting image: ${error}`);
            throw new Error(`Error getting image: ${(error as Error).message}`);
        }
    }

    async getThumbnail(imageData: ImageData): Promise<Buffer> {
        try {
            return await fs.readFile(imageData.thumbnailPath);
        } catch (error ) {
            console.error(`Error getting thumbnail: ${error}`);
            throw new Error(`Error getting thumbnail: ${(error as Error).message}`);
        }
    }

    async saveImage(imageData: ImageData, image: Buffer): Promise<void> {
        try {
            await fs.writeFile(imageData.imagePath, image);
            // Optionally save thumbnail here if generation happens on upload
        } catch (error) {
            console.error(`Error saving image: ${error}`);
            throw new Error(`Error saving image: ${(error as Error).message}`);
        }
    }

    async saveThumbnail(imageData: ImageData, thumbnail: Buffer): Promise<void> {
        try {
            await fs.writeFile(imageData.thumbnailPath, thumbnail);
        } catch (error) {
            console.error(`Error saving thumbnail: ${error}`);
            throw new Error(`Error saving thumbnail: ${(error as Error).message}`);
        }
    }

    async deleteImage(imageData: ImageData): Promise<void> {
        try {
            await fs.unlink(imageData.imagePath);
        } catch (error) {
            console.error(`Error deleting image: ${error}`);

        }
    }

    async deleteThumbnail(imageData: ImageData): Promise<void> {
        try {
            await fs.unlink(imageData.thumbnailPath);
        } catch (error) {
            console.error(`Error deleting thumbnail: ${error}`);

        }
    }

    async checkImage(imageData: ImageData): Promise<boolean> {
        try {
            await fs.access(imageData.imagePath);
            return true;
        } catch {
            return false;
        }
    }

    async checkThumbnail(imageData: ImageData): Promise<boolean> {
        try {
            await fs.access(imageData.thumbnailPath);
            return true;
        } catch {
            return false;
        }
    }
}



class ImageRepoService{
    private imageCollection: Collection;
    private searchBy = {
        _id: "_id",
        uploadDate: "uploadDate",
        sanitizedFilename: "sanitizedFilename",
        tags: "tags",
    }

    private queryBuilder(fieldName: string, value: any) {
        const query = { [fieldName]: value };
        if(fieldName === "_id" && typeof value === "string"){
            query[fieldName] = new ObjectId(value as string);
        }
        return query;
    }

    constructor(collection: string = collections.images) {
        this.imageCollection = db.collection(collections.images);
    }

    async get(fieldName? : string, value? : string): Promise<ImageData[] | null> {
        const query = fieldName ? this.queryBuilder(fieldName, value) : {};
        return this.imageCollection.find(query).toArray() as Promise<ImageData[]>;
    }

    async getOne(fieldName: string, value: any): Promise<ImageData | null> {
        return this.imageCollection.findOne(this.queryBuilder(fieldName, value)) as Promise<ImageData>;
    }

    async updateOne(id: string | ObjectId, data: ImageData): Promise<void> {
        await this.imageCollection.updateOne(this.queryBuilder("_id", id), {$set: data});
    }

    async deleteOne(fieldName: string, value: any): Promise<void> {
        await this.imageCollection.deleteOne(this.queryBuilder(fieldName, value));
    }

    async getPage(currPage: number, pageLength: number, tagSearch?: string[], sort?: {}): Promise<ImageData[] | null> {
        const startInd = (currPage - 1) * pageLength;
        const imageFilter = tagSearch ? txtToSearchParam(tagSearch[0]) : {};

        const images = await this.imageCollection
        .find(imageFilter)
        .sort({ uploadDate: -1 })
        .skip(startInd)
        .limit(pageLength)
        .toArray();

        return images as ImageData[];
    }

    async getAdjacentTimestamps(timestamp: string): Promise<{ prev: string | null, curr: string | null, next: string | null }> {
        //mongodb projection for returning only the uploadDate field
        const projection = { uploadDate: 1, _id: 0 };
        const currImage = { uploadDate:timestamp };

        const prevImage = await this.imageCollection.findOne(
            { uploadDate: { $lt: timestamp } },
            { sort: { uploadDate: -1 }, projection: projection }
          );

          const nextImage = await this.imageCollection.findOne(
            { uploadDate: { $gt: timestamp } },
            { projection: projection }
          );
          
        console.log(prevImage, currImage, nextImage);
        return { prev: prevImage?.uploadDate || null, curr: currImage?.uploadDate || null, next: nextImage?.uploadDate || null };
    }

    async create(imageData : ImageData): Promise<string | null>{
        try {
            await this.imageCollection.insertOne(imageData)
            console.log(`File ${imageData.sanitizedFilename}, ${imageData.originalName} written to DB and filesystem`)
            return "written to DB"
        } catch (error) {
            console.log(`Error writing ${imageData.sanitizedFilename}, ${imageData.originalName} to DB`)
            return null
        }
    }
    
}

export function sanitizeImage(image : ImageData): ImageData {
    image.strId = image._id?.toString();
    delete image._id
    return image;
}

class FileUtilityServicee {
    private fileServiceObj: FileService;
    private imageRepoObj: ImageRepoService;

    constructor() {
        this.fileServiceObj = fileService;
        this.imageRepoObj = imageRepo;
    }

    async createThumbnail(imageData: ImageData, buffer? : Buffer): Promise<void> {
        if(!buffer){
            buffer = await this.fileServiceObj.getImage(imageData);
        }
        
        if( imageData.thumbnailPath.length > 0 ){
            try{
                await this.fileServiceObj.checkThumbnail(imageData);
            } catch {
                imageData.thumbnailPath = "";
                this.createThumbnail(imageData, buffer);
            }
        } else {
            imageData.thumbnailPath = `thumb/${imageData.sanitizedFilename}_thmb.webp`;
            try{
                if(!imageData._id) throw new Error('No ID for image data');
                const thumbData = await sharp(buffer)
                .resize({width: 200})
                .webp()
                .toBuffer();
                await this.fileServiceObj.saveThumbnail(imageData, thumbData);
                console.log(`thumbnail created for ${imageData.sanitizedFilename}`)
                this.imageRepoObj.updateOne(imageData._id, imageData)
            } catch (error) {
                console.log(`unable to create thumbnail from ${imageData.sanitizedFilename}`)
            }
        }

    }

    async hashFile(imageBuffer: Buffer): Promise<string> {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(imageBuffer);
            const fsHash = hash.digest('hex').slice(0,24);
            return fsHash;
        } catch (error: any) {
            throw new Error('Error while hashing file: ' + error.message);
        }
    }

    async checkBadEntry(imageData : ImageData): Promise<{deleted : number, accessible: boolean}>  {
        if( imageData.imagePath === "" ){
            console.log(`No image path for ${imageData.sanitizedFilename}`);
            if(imageData.thumbnailPath) this.fileServiceObj.deleteThumbnail(imageData);
            this.imageRepoObj.deleteOne("_id", imageData._id);
            return {deleted: 1, accessible: false};
        }
        try {
            await fs.access(imageData.imagePath); //will fail if file does not exist or not accessible
            await fs.access(imageData.thumbnailPath); //will fail if file does not exist or not accessible  
            return {deleted: 0, accessible: true};
        } catch(error) {
            console.error(`image file ${error} not accessible`)
        }
        return {deleted: 0, accessible: false};
    }

    async compareDBToDir(): Promise<String[][]> { // trues up database and image directory
        const filelist = await this.fileServiceObj.getDir("images");
        const dblist = await imageRepo.get();

        if(dblist === null) throw new Error('Error getting image data from database')
        
        const dbFileNames = dblist.map((document) => document.sanitizedFilename);
        const dirFileNames = filelist;

        const missingFiles = dbFileNames.filter( file => !dirFileNames.includes(file));
        const missingDBRecord = dirFileNames.filter( file => !dbFileNames.includes(file));
        return [ missingFiles, missingDBRecord ]
    }
    
}


const fileService = new FileService();
export const imageRepo = new ImageRepoService();
//export const imageAddrService = new ImageAddrService(db.collection(collections.images));
export const fileUtilService = new FileUtilityServicee();