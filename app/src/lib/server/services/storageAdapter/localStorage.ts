import fs from "fs/promises"
import type { FileOperationResult } from "$lib/types/services";
import type { storageAdapter } from "./types";

class localStorage implements storageAdapter {

    readFile(filePath: string): Promise<Buffer> {
         const file= fs.readFile(filePath);

         return file;
    }

    async writeFile(filePath: string, data: Uint8Array): Promise<FileOperationResult> {
        try {
            if(!data){
                return {
                    success: false,
                    message: 'file data is empty',
                }
            }
                
            await fs.writeFile(filePath, data);
            return {
                success: true,
                message: `file saved to ${filePath}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error saving file: FilePath: ${filePath} Error: ${error}`
            }
        }
    }

    deleteFile(fileName: string): Promise<FileOperationResult> {
        try{
            const results = fs.unlink(fileName)

            return {
                success: true
            }
        } catch (error) {
            return {
                success: false
            }
        }
    }

    listFiles(path: string): Promise<string[]> {
        const results = fs.readdir(path)

        return results
    }
}