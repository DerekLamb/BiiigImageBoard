import type { FileOperationResult } from "$lib/types/services";
import fs from 'fs/promises';

class FileWriter {
    
    private defaultConfig = { // need to move to user config in db 
        uploadDir: 'images/',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/webm', 'video/mp4'],
        maxFileSize: 20 * 1024 * 1024, // 20MB
    };

    constructor( permissionManager ) {
        this._permissionManager = permissionManager;
    }

    async writeFile(User, Path: string, Data: Buffer): Promise<FileOperationResult> {

        try {
            const directory = options.directory || this.config.uploadDir;

            // if (!tpermissionManager.Allowed(directory)) {
            //     return {
            //         success: false,
            //         message: 'Access denied to this directory'
            //     };
            // }
            
            if(!Data){
                return {
                    success: false,
                    message: 'file data is empty',
                }
            }
            
            
            await fs.write(Path, Data);
            
            return {
                success: true,
                data: {
                path: filePath,
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Error saving file: ${error}`
            };
        }
    }
}