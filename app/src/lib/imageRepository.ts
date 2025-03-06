import { ObjectId, Collection } from "mongodb"
import { db } from '$lib/db.server'
import txtToSearchParam from "./SearchTxtToFilter";


interface ImageData {
    _id?: ObjectId,
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: string;
    thumbnailPath: string | null;
    tags: string[] | null;
    embPrompt?: string[][] | null;
    related?: string[] | null;
    favorite?: string[] | null;
    hidden?: string[] | null;
}

class ImageRepository {
    private collection: Collection;
    
    constructor(collectionName: string){
        this.collection = db.collection(collectionName);
    }

    private async getOneByField(fieldName: string, value: any): Promise<ImageData | null> {
        const query = { [fieldName]: value };
        return this.collection.findOne(query) as Promise<ImageData>;
    }

    private async deleteOneByField(fieldName: string, value: any): Promise<void> {
        const query = { [fieldName]: value };
        await this.collection.deleteOne(query);
    }

    async getById(id: string): Promise <ImageData | null> {
        return this.getOneByField("_id", new ObjectId(id));
    }

    async getByFileName(fileName: string): Promise <ImageData | null> {
        return this.getOneByField("sanitizedFilename", fileName);
    }

    async getByTimestamp(timestamp: string): Promise <ImageData | null> {
        return this.getOneByField("uploadDate", timestamp);
    }

    async getAdjacentTimestamps(timestamp: string): Promise<{ prev: string | null, curr: string | null, next: string | null }> {
        //mongodb projection for returning only the uploadDate field
        const projection = { uploadDate: 1, _id: 0 };
        const currImage = { uploadDate:timestamp };

        const prevImage = await this.collection.findOne(
            { uploadDate: { $lt: timestamp } },
            { sort: { uploadDate: -1 }, projection: projection }
          );

          const nextImage = await this.collection.findOne(
            { uploadDate: { $gt: timestamp } },
            { projection: projection }
          );
          
        console.log(prevImage, currImage, nextImage);
        return { prev: prevImage?.uploadDate || null, curr: currImage?.uploadDate || null, next: nextImage?.uploadDate || null };
    }

    async get(filter = {}): Promise <ImageData[]> {
        //default returns everything
        return this.collection.find(filter).toArray() as Promise<ImageData[]>;
    }

    async getPage(currPage: number, pageLength: number, tagSearch?: string[], sort?: {}): Promise<ImageData[]> {
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
        const embPrompt = null;
        console.log(fileHash)
        const imageData : ImageData = {
            _id: new ObjectId(fileHash),
            originalName: fileName,
            sanitizedFilename: sanitizedFilename,
            imagePath: `${imagePath}/${sanitizedFilename}`, 
            uploadDate: timestamp,
            thumbnailPath: thumbPath,
            embPrompt: embPrompt,
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

    async deleteByFileName(fileName: string): Promise<void> {
        this.deleteOneByField("sanitizedFilename", fileName);
    }
}

const imageRepo : ImageRepository = new ImageRepository("testimages");

export {imageRepo, ImageRepository}
