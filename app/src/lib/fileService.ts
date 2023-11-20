import fs from "fs/promises";
import { constants } from 'fs';

class ImageFile  {
    private dirPath: string;
    private fileName: string;
    private buffer: Buffer | null = null;

    constructor(fileName: string, dirPathOrBuffer: string | Blob){
        var dirPath = ""
        var data: Blob;
        if(dirPathOrBuffer instanceof Blob){
            data = dirPathOrBuffer;
        } else if(typeof dirPathOrBuffer === 'string') {
            data = fs.readFile(`${this.dirPath}/${fileName}`)
            dirPath = dirPathOrBuffer
        }
        this.dirPath = dirPath;
        this.fileName = fileName;
    }

    async create(fileName: string, data: Buffer, dataFormat:string = "base64"): Promise <void>{
        fs.writeFile(`${this.dirPath}/${fileName}`, data, "base64")
    }

    async read(): Promise <Buffer | null>{
        if(this.buffer == null){
            const fileData = await fs.readFile(`${this.dirPath}/${this.fileName}`);
            return fileData;
        } else { 
            return this.buffer;
        }

    }

    async exists(): Promise<boolean> {
        try {
            await fs.access(`${this.dirPath}/${this.fileName}`, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async delete(fileName: string): Promise <void>{
            fs.unlink(`${this.dirPath}/${fileName}`);
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