import fs from "fs/promises";
import { constants } from 'fs';
import { createMissingThumbnails } from "./processFiles";

class ImageFile {
    private dirPath: string | null = null;
    private fileName: string;
    private fileData: Buffer | null = null;
    //private hash: string;

    constructor(dirPath: string, fileName: string, data?: Buffer){
        this.fileData = data ? data : null;
        this.fileName = fileName;
        this.dirPath = dirPath;
    }

    async write(): Promise <void>{
        if (this.fileData instanceof Buffer) {
            // const newFile = await fs.open(`${this.dirPath}/${this.fileName}`)
            // newFile.writeFile(this.fileData,'base64');
            // newFile.close();
            try{
                fs.writeFile(`${this.dirPath}/${this.fileName}`, this.fileData)
            } catch (error) {
                throw new Error(`Error writing file ${this.fileName}: ${error}`)
            }
        }
        else {
            throw(`Data Buffer for ${this.fileName} not defined`)
        }
    }

    async read(): Promise <Buffer>{
        if(this.fileData == null){
            const fileData = await fs.readFile(`${this.dirPath}/${this.fileName}`);
            return fileData;
        } else { 
            return this.fileData;
        }

    }

    async update(data: Buffer){
        this.fileData = data;
    }

    async delete(): Promise <void>{
        fs.unlink(`${this.dirPath}/${this.fileName}`);
    }

    async exists(): Promise<boolean> {
        try {
            await fs.access(`${this.dirPath}/${this.fileName}`, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async compareWithStored(): Promise<boolean>{
            return true
    }

    async writeThumb(data?: Buffer){
        const thumbName = `${this.fileName}_thmb.webp`;
        if(data || this.fileData) {

        } else {
            console.log()
        }
    }

    async unloadBuffer(): Promise<void>{
        this.fileData = null 
    }

}

class FileRepository {
    private dirPath: string
    private files: Map<string, ImageFile>

    constructor(dirPath: string,) { 
        this.files = new Map();
        this.dirPath = dirPath;
    }

    async addFile(fileName: string, fileData: any) {
        const imageFile = new ImageFile(this.dirPath, fileName, fileData);
        this.files.set(fileName, imageFile);
        try {
            if (fileData) {
                await imageFile.write();
            } else {
                console.log("File data is empty. Skipping write operation.");
            }
        } catch (error) {
            console.log("Error occurred while writing file:", error);
        }
    }

    async readFile(fileName: string): Promise<Buffer>{
        let imgFileObj =  await this.files.get(fileName) ?? new ImageFile(this.dirPath, fileName);
        if(await imgFileObj.exists()){
            return imgFileObj.read();
        }
        throw new Error(`File ${fileName} not found in repository`)
    }

    async deleteFile(fileName: string, hashID?: string) {
        let imgFileObj = this.files.get(fileName);
        if(imgFileObj){
            imgFileObj.delete();
            this.files.delete(fileName); // this is really confusing but not sure what to change yet.
        } else {
            console.log(`File ${fileName} not found in repository`);
        }
    }

    async updateFiles() {
        const dirFiles = await fs.readdir(this.dirPath);
        dirFiles.forEach( item => {
            if(!this.files.has(item)) {
                this.files.set(item, new ImageFile(item, ""))
            }
        });
        return this.files;
    }

    async safeUpdateFiles() {
        //build out a comparison that will handle files that were deleted unsafely, possibly store in array 
        return this.files;
    }
    
    async memAddFile(fileName: string, fileData: any){
        const imageFile = new ImageFile(fileName, fileData)
        
        try {
            imageFile.write();
        } catch (error) {
            console.log("err occured writing file")
        }

        imageFile.unloadBuffer();
        this.files.set(fileName, imageFile)
    }

    async updateListFiles(){
        const dirFiles = await fs.readdir(this.dirPath);
        
    }

}

const mainFileRepo : FileRepository = new FileRepository("images")
const thumbFileRepo : FileRepository = new FileRepository("thumb")

export {ImageFile, FileRepository, mainFileRepo, thumbFileRepo};