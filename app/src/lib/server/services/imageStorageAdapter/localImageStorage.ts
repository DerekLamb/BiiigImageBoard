import fs from "fs/promises";
import type { FileOperationResult } from "$lib/types/services";
import type { imageStorageAdapter } from "./types";

class LocalImageStorage implements imageStorageAdapter {

    async readImage(filePath: string): Promise<Buffer> {
        return await fs.readFile(filePath);
    }

    async writeImage(filePath: string, data: Buffer): Promise<FileOperationResult> {
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

    async deleteImage(filePath: string): Promise<FileOperationResult> {
        try {
            await fs.unlink(filePath);
            return {
                success: true,
                message: `file deleted from ${filePath}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error deleting file: FilePath: ${filePath} Error: ${error}`
            }
        }
    }

    async deleteThumbnail(filePath: string): Promise<FileOperationResult> {
        return await this.deleteImage(filePath);
    }

    async fileExists(filePath: string): Promise<boolean> { //TODO fix File Operation Result return 
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

export const localImageStorage = new LocalImageStorage()
