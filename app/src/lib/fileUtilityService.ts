import type { FileRepository } from "$lib/fileService";
import { mainFileRepo } from "$lib/fileService";
import type { ImageRepository } from "./imageRepository";

import sharp from 'sharp';
import crypto from 'crypto';
import promptDecode from "$lib/ExtractPrompt";

class fileUtiltyService {
    private fileServiceObj;

    constructor(fileServiceObj: FileRepository){
        this.fileServiceObj = fileServiceObj;
    }

    private async readFile(fileName: string): Promise<Buffer> {
        try {
            return await this.fileServiceObj.readFile(fileName) as Buffer;
        } catch (error) {
            throw new Error(`Error reading file ${fileName}: ${error}`);
        }
    }

    async createThumbnail(fileName: string, file?: Buffer):Promise<[string, Buffer | null]>{ //returns a tuple of [string, buffer]
        if(!file){
            try{
                file = await this.readFile(fileName);
            } catch (error) {
                throw new Error(`Error reading file ${fileName}: ${error}`)
            }
        }
        const thumbName = `${fileName}_thmb.webp`;
        let thumbData = null;
        try {
            thumbData = await sharp(file)
            .resize({width: 200})
            .webp()
            .toBuffer();

        } catch (error) {
            console.log(`unable to create thumbnail from ${fileName}`)
        }
        return [thumbName, thumbData]
    }

    async extractPrompt(file: string | Buffer){
        let fileData = null;
        if(typeof file === 'string'){
            fileData = await this.readFile(file);
        }
        else if (file instanceof Buffer){
            fileData = file;
        }
        else{
            throw new Error('Invalid input. Expecting string or Buffer.');
        }
        
        if(fileData){
            const prompt = promptDecode(fileData);
            if(prompt){
                console.log(prompt);
                return prompt;
            }
        }
    }

    async hashFile(file: string | Buffer): Promise<string> {
        let buffer: Buffer;

        if (typeof file === 'string') {
            buffer = await this.readFile(file); //add safety here 
        } else if (typeof file === 'object' && file instanceof Buffer) {
            buffer = file;
        } else {
            throw new Error('Invalid input. Expecting string or Buffer.');
        }

        try {
            const hash = crypto.createHash('sha256');
            hash.update(buffer);
            const fsHash = hash.digest('hex').slice(0,24);
            return fsHash;
        } catch (error: any) {
            throw new Error('Error while hashing file: ' + error.message);
        }

    } 

    async compareDBToDir(imageRepository: ImageRepository){ // trues up database and image directory
        const filelist = await this.fileServiceObj.updateFiles()
        const dblist = await imageRepository.get();
        
        const dbFileNames = dblist.map((document) => document.sanitizedFilename);
        const dirFileNames = filelist;

        const missingFiles = dbFileNames.filter( file => !dirFileNames.includes(file));
        const missingDBRecord = dirFileNames.filter( file => !dbFileNames.includes(file));
        return [missingFiles, missingDBRecord]
    }

    async missingThumbAll(imageRepository: ImageRepository, thumbFileRepo: FileRepository){
        const results = await imageRepository.get({ $or: [{thumbnailPath: {$exists:null}}, {thumbnailPath: ""}]});
        
        Promise.all(results.map( async (image) => {
            const thumb = await this.createThumbnail(
                image.sanitizedFilename,
                await this.readFile(image.sanitizedFilename)
            );

            if(thumb[1] && image._id) {
                thumbFileRepo.addFile(thumb[0], thumb[1]);
                imageRepository.update(image._id.toString(), {thumbnailPath: `thumb/${thumb[0]}`});
            }
        }))
    }

    async extractPromptAll(imageRepository: ImageRepository){
        const results = await imageRepository.get({ $or: [{prompt: {$exists:null}}, {prompt: ""}]});
        Promise.all(results.map( async (image) => {
            const extractedData = await this.extractPrompt(image.sanitizedFilename);
            if(extractedData && image._id) {
                console.log(`Prompt found for ${image.sanitizedFilename}`)
                imageRepository.update(image._id.toString(), {embPrompt: extractedData.prompt});
            }
            else { 
                console.log(`No prompt found for ${image.sanitizedFilename}`)
            }
        }))
    }
}

export const fileUtilService = new fileUtiltyService(mainFileRepo);
export type {fileUtiltyService};