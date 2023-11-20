import fs from "fs/promises";
import { constants } from 'fs';

class ImageFile {
    private dirPath: string | null = null;
    private fileName: string;
    private fileData: Buffer | null;

    constructor(dirPath: string, fileName: string, data?: Buffer){
        this.fileData = data ? data : null;
        this.fileName = fileName;
        this.dirPath = dirPath;
    }

    async create(): Promise <void>{
        if (this.fileData instanceof Buffer) {
            const newFile = await fs.open(`${this.dirPath}/${this.fileName}`)
            newFile.writeFile(this.fileData);
            newFile.close();
        }
        else {
            throw(`Data Buffer for ${this.fileName} not defined`)
        }
    }

    async read(): Promise <Buffer | null>{
        if(this.buffer == null){
            const fileData = await fs.readFile(`${this.dirPath}/${this.fileName}`);
            return fileData;
        } else { 
            return this.buffer;
        }

    }

    async update(data: Buffer){
        this.fileData = data;
    }

    async delete(): Promise <void>{
        fs.unlink(`${this.dirPath}/${fileName}`);
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

    }

    async readFile(fileName: string): Promise<Buffer>{

    }

    async deleteFile(fileName: string, hashID?: string) {

    }



}


export ImageFile
export default FileRepository