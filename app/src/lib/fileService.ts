import fs from "fs/promises";
import { constants } from 'fs';

class imageFile extends File {
    private directoryPath: string;
    constructor(relativePath: string){
        this.directoryPath = relativePath;
    }

    async create(fileName: string, data: Buffer, dataFormat:string = "base64"): Promise <void>{
        fs.writeFile(`${this.directoryPath}/${fileName}`, data, "base64")
    }

    async read(fileName: string): Promise <Buffer | null>{
        const fileData = await fs.readFile(`${this.directoryPath}/${fileName}`);
        return fileData;
    }

    async exists(fileName: string): Promise <boolean>{
        try {
            await fs.access(`${this.directoryPath}/${fileName}`, constants.F_OK);
            return true;            
        } catch {
            return false;
        }
    }

    async delete(fileName: string): Promise <void>{
            fs.unlink(`${this.directoryPath}/${fileName}`);
    }
}


export default imageFileService