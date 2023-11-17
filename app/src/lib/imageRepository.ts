import { ObjectId } from "mongodb"
import db from '$lib/db'


interface ImageData {
    originalName: string;
    sanitizedFilename: string;
    imagePath: string;
    uploadDate: Date;
    thumbnailPath: string | null;
    tags: string[] | null;
}

class ImageRepository {
    private collection: Collection;
    
    constructor(collectionName: string){
        this.collection = db.collection(collectionName);
    }

    async getById(id: string): Promise <ImageData | null> {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async getAll(): Promise <ImageData[]> {
        return this.collection.find({}).toArray();
    }

    async create(imageData: ImageData): Promise<void> {
        await this.collection.insertOne(imageData);
    }

    async update(id: string, imageData: Partial<ImageData>): Promise<void> { // may need to recheck this... 
        await this.collection.updateOne({ _id: new ObjectId(id) }, {$set: imageData });
    }

    async delete(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}