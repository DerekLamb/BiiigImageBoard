import fs from "fs/promises";
import { constants } from 'fs';
import { createMissingThumbnails } from "./processFiles";

class ImageFile {
    private dirPath: string | null = null;
    private fileName: string;
    private fileData: Buffer | null = null;
    private hash: string;

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
            await fs.writeFile(`./${this.dirPath}/${this.fileName}`, this.fileData)
        }
        else {
            throw(`Data Buffer for ${this.fileName} not defined`)
        }
    }

    async read(): Promise <Buffer | null>{
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
        const imageFile = new ImageFile(fileName, fileData)
        this.files.set(fileName, imageFile)
        try {
            imageFile.write();
        } catch (error) {
            console.log("err occured writing file")
        }
    }

    async readFile(fileName: string): Promise<Buffer | null>{
        let imgFileObj =  await this.files.get(fileName) ?? new ImageFile(this.dirPath, fileName);
        if(await imgFileObj.exists()){
            return  imgFileObj.read();
        }
        return null;
    }

    async deleteFile(fileName: string, hashID?: string) {
        let imgFileObj = await this.files.get(fileName);
        if(imgFileObj){
            imgFileObj.delete();
        } else {
            console.log(`File ${fileName} not found in repository`);
        }
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