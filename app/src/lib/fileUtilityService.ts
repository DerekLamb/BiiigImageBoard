import type {FileRepository} from "$lib/fileService";
import {mainFileRepo} from "$lib/fileService";
import type { ImageRepository } from "./imageRepository";

import sharp from 'sharp';
import crypto from 'crypto';
import promptDecode from "$lib/ExtractPrompt";

class fileUtiltyService {
    private fileServiceObj;

    constructor(fileServiceObj: FileRepository){
        this.fileServiceObj = fileServiceObj;
    }

    async createThumbnail(fileName: string, file?: Buffer):Promise<[string, Buffer | null]>{ //returns a tuple of [string, buffer]
        if(!file){
            try{
                file = await this.fileServiceObj.readFile(fileName);
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
            fileData = await this.fileServiceObj.readFile(file);
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
                return prompt;
            }
        }
    }

    async hashFile(file: string | Buffer): Promise<string> {
        let buffer: Buffer;

        if (typeof file === 'string') {
            buffer = await this.fileServiceObj.readFile(file);
        } else if (typeof file === 'object' && file instanceof Buffer) {
            buffer = file;
        } else {
            throw new Error('Invalid input. Expecting string or Buffer.');
        }

        try {
            const hash = crypto.createHash('sha256');
            hash.update(buffer);
            const fsHash = hash.digest('base64').slice(0,12);
            return fsHash;
        } catch (error: any) {
            throw new Error('Error while hashing file: ' + error.message);
        }

    } 

    async checkAllFiles(imageRepository: ImageRepository){
        const filelist = await this.fileServiceObj.updateFiles()
        const dblist = await imageRepository.get();
        
        const dbFileNames = dblist.map((document) => document.sanitizedFilename);
        const dirFileNames = Array.from(filelist.keys());

        const missingFiles = dbFileNames.filter( file => !dirFileNames.includes(file));
        const missingDBRecord = dirFileNames.filter( file => !dbFileNames.includes(file));
        return [missingFiles, missingDBRecord]
    }

    async missingThumbAll(imageRepository: ImageRepository, thumbFileRepo: FileRepository){
        //const filelist = await this.fileServiceObj.updateFiles();
        const results = await imageRepository.get({ $or: [{thumbnailPath: {$exists:null}}, {thumbnailPath: ""}]});
        
        Promise.all(results.map( async (image) => {
            const thumb = await this.createThumbnail(
                image.sanitizedFilename,
                await this.fileServiceObj.readFile(image.sanitizedFilename)
            );

            if(thumb[1] && image._id) {
                thumbFileRepo.addFile(thumb[0], thumb[1]);
                imageRepository.update(image._id.toString(), {thumbnailPath: `thumb/${thumb[0]}`});
            }
        }))
    }
}

export const fileUtilService = new fileUtiltyService(mainFileRepo);
export type {fileUtiltyService};