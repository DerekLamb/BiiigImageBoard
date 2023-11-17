import fs from "fs/promises";
import { constants } from 'fs';

class ImageFile extends File {
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
        super(data, fileName);
        this.dirPath = dirPath;
        this.fileName = fileName;
    }

    async create(fileName: string, data: Buffer, dataFormat:string = "base64"): Promise <void>{
        fs.writeFile(`${this.dirPath}/${fileName}`, data, "base64")
    }

    async read(fileName: string): Promise <Buffer | null>{
        const fileData = await fs.readFile(`${this.dirPath}/${fileName}`);
        return fileData;
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


export default ImageFile