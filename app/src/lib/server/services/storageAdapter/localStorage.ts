import fs from "fs/promises"
import type { storageAdapter } from "./types";

class localStorage implements storageAdapter {

    readFile(fileName: string): Promise<Buffer> {
         const fileData = fs.readFile(fileName);

         return fileData;
    }

    writeFile(fileName: string, data: Buffer): Promise<void> {
        const results = fs.writeFile( fileName, data);

        return results;
    }

    deleteFile(fileName: string): Promise<void> {
        const results = fs.unlink(fileName)

        return results;
    }

    listFiles(path: string): Promise<string[]> {
        const results = fs.readdir(path)

        return results
    }
}