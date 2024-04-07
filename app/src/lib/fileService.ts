import fs from "fs/promises";
import { createReadStream } from "fs";
import { constants } from 'fs';
import { createMissingThumbnails } from "./processFiles";
import { error } from "console";

class ImageFile {
    private dirPath: string | null = null;
    private fileName: string;
    //private hash: string;

    constructor(dirPath: string, fileName: string, data?: Buffer){
        this.fileName = fileName;
        this.dirPath = dirPath;
    }

    async write(fileData : Buffer): Promise <void>{
        if (fileData instanceof Buffer) {
            try{
                await fs.writeFile(`${this.dirPath}/${this.fileName}`, fileData)
            } catch (error) {
                throw new Error(`Error writing file ${this.fileName}: ${error}`)
            }
        }
        else {
            throw(`Data Buffer for ${this.fileName} not defined`)
        }
    }

    async read(): Promise <Buffer>{
            const fileData = await fs.readFile(`${this.dirPath}/${this.fileName}`);
            return fileData;
    }

    createReadStream(){
        return createReadStream(`${this.dirPath}/${this.fileName}`);
    }

    async delete(): Promise <void>{
        try{
            await fs.unlink(`${this.dirPath}/${this.fileName}`);
        }
        catch (error) {
            throw new Error(`Error deleting file ${this.fileName}: ${error}`)
        }
    }

    async exists(): Promise<boolean> {
        try {
            console.log(`${this.dirPath}/${this.fileName}`)
            await fs.access(`${this.dirPath}/${this.fileName}`, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    private async compareWithStored(): Promise<boolean>{
            return true
    }

}

class FileRepository {
    private dirPath: string
    private files: Map<string, ImageFile>

    constructor(dirPath: string,) { 
        this.files = new Map();
        this.dirPath = dirPath;
    }

    async addFile(fileName: string, fileData: Buffer | null) {
        const imageFile = new ImageFile(this.dirPath, fileName);
        this.files.set(fileName, imageFile);
        try {
            if (fileData) {
                this.ensurePathExists();
                await imageFile.write(fileData);
            } else {
                console.log("File data is empty. Skipping write operation.");
            }
        } catch (error) {
            console.log("Error occurred while writing file:", error);
        }
    }

    async readFile(fileName: string): Promise<Buffer|void>{
        let imgFileObj = new ImageFile(this.dirPath, fileName);
        if(await imgFileObj.exists()){
            return imgFileObj.read();
        }
        else {
            console.log(`cannot find file ${fileName}`)
        }
    }

    //file stream smart function 
    async createReadStream(fileName: string){
        let imgFileObj = new ImageFile(this.dirPath, fileName);
        if(await imgFileObj.exists()){
            return imgFileObj.createReadStream();
        }
        else {
            return error(`cannot find file ${fileName}`)
            
        }
    }

    async deleteFile(fileName: string, hashID?: string) {
        try{
            let imgFileObj = new ImageFile(this.dirPath, fileName)
            if(await imgFileObj.exists()){
                imgFileObj.delete();
            }
            else {
                console.log(`cannot find file ${fileName}`);
            }
        } catch {
            console.log(`Error deleting ${fileName} from dir`)
        }
    }

    async updateFiles() {
        const dirFiles = await fs.readdir(this.dirPath);
        dirFiles.forEach( item => {
            if(!this.files.has(item)) {
                this.files.set(item, new ImageFile(item, ""))
            }
        });
        return dirFiles;
    }

    async safeUpdateFiles() {
        //build out a comparison that will handle files that were deleted unsafely, possibly store in array 
        return this.files;
    }
    
    async ensurePathExists(): Promise<boolean>{

        try {
            await fs.access(this.dirPath, constants.F_OK);
            return true;
        }
        catch {
            try {
                await fs.mkdir(this.dirPath);
                return true;
            } catch (error) {
                console.log(`Error creating directory ${this.dirPath}: ${error}`)
                return false;
            }
        }
    }

    async updateListFiles(){
        const dirFiles = await fs.readdir(this.dirPath);
        
    }

}

const mainFileRepo : FileRepository = new FileRepository("images")
const thumbFileRepo : FileRepository = new FileRepository("thumb")

export {ImageFile, FileRepository, mainFileRepo, thumbFileRepo};