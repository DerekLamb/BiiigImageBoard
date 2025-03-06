import { FileModel } from '$lib/server/models/fileModel';
import path from 'path';
import fs from 'fs/promises';

interface FileOperationResult {
    success: boolean;
    message?: string;
    data?: any;
}

interface UserAccess {
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
    allowedDirectories: string[];
}

class FileController {
    // Default configuration
    private defaultConfig = {
        uploadDir: 'images/',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/webm', 'video/mp4'],
        maxFileSize: 20 * 1024 * 1024, // 20MB
    };

    private config: typeof this.defaultConfig;
    private allowedDirectories: string[] = ['images/', 'thumb/'];
    private userAccessMap: Map<string, UserAccess> = new Map();

    constructor(customConfig: Partial<typeof this.defaultConfig> = {}) {
        this.config = { ...this.defaultConfig, ...customConfig };
        this.ensureDirectories();
    }


    addAllowedDirectory(directory: string): void {
        if (!this.allowedDirectories.includes(directory)) {
            this.allowedDirectories.push(directory);
        }
    }
    

    setUserAccess(access: UserAccess): void {
        this.userAccessMap.set(access.userId, access);
    }
    

    isDirectoryAllowed(directory: string, userId?: string): boolean {
        const normalizedDir = path.normalize(directory);
        
        if (!this.allowedDirectories.some(dir => normalizedDir.startsWith(dir))) {
            return false;
        }
        

        if (userId) {
            //implement user status check from db.
        }
        
        return true;
    }

    private async ensureDirectories() {
        const dirs = this.allowedDirectories;
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }

    async saveFile(filePath: string, fileData: Buffer, options: { 
        directory?: string,
        userId?: string
    } = {}): Promise<FileOperationResult> {

        try {
            const directory = options.directory || this.config.uploadDir;

            if (!this.isDirectoryAllowed(directory)) {
                return {
                    success: false,
                    message: 'Access denied to this directory'
                };
            }
            
            // const filePath = path.join(directory, fileName);
            
            await FileModel.write(filePath, fileData);
            
            let thumbnailPath = null;
            
            // if (options.createThumbnail) {
            //     try {
            //     const thumbnailBuffer = await FileModel.createThumbnail(fileData);
            //     const thumbnailFilename = `${path.parse(filename).name}_thumb.webp`;
            //     thumbnailPath = path.join('thumb/', thumbnailFilename);
            //     await FileModel.write(thumbnailPath, thumbnailBuffer);
            //     } catch (error) {
            //     console.error('Error creating thumbnail:', error);
            //     }
            // }
            
            return {
                success: true,
                data: {
                path: filePath,
                thumbnailPath
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Error saving file: ${error}`
            };
        }
    }

    async getFile(fileName: string, userId?: string): Promise<Buffer | null> {
        const filePath = path.join(this.config.uploadDir, fileName )
        try {
            return await FileModel.read(filePath);
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return null;
        }
    }

    async deleteFile(filePath: string, options: {
        deleteThumbnail?: boolean,
        userId?: string
    } = {}): Promise<FileOperationResult> {
        // Check directory permissions
        if (!this.isDirectoryAllowed(filePath, options.userId)) {
            return {
                success: false,
                message: 'Access denied to this file'
            };
        }
        
        try {
            const exists = await FileModel.checkExists(filePath);
            if (!exists) {
                return {
                success: false,
                message: 'File not found'
                };
            }
            
            await FileModel.delete(filePath);
            
            if (options.deleteThumbnail) {
                const parsedPath = path.parse(filePath);
                const thumbPath = path.join('thumb/', `${parsedPath.name}_thumb.webp`);
                
                const thumbExists = await FileModel.checkExists(thumbPath);
                if (thumbExists) {
                await FileModel.delete(thumbPath);
                }
            }
            
            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error deleting file: ${error}`
            };
        }
    }

    async createThumbnail(source: string | Buffer, options: { 
        width?: number, 
        format?: string, 
        userId?: string 
    } = {}): Promise<FileOperationResult> {
        if (typeof source === 'string' && !this.isDirectoryAllowed(source, options.userId)) {
            return {
                success: false,
                message: 'Access denied to this file'
            };
        }
        
        
        try {
            const thumbnailBuffer = await FileModel.createThumbnail(
                source, 
                options.width || 200
            );
            
            return {
                success: true,
                data: {
                buffer: thumbnailBuffer
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Error creating thumbnail: ${error}`
            };
        }
    }

    async listFiles(directory: string, userId?: string): Promise<string[]> {
        // Check directory permissions
        if (!this.isDirectoryAllowed(directory, userId)) {
            console.error(`Access denied to directory ${directory}`);
            return [];
        }
        
        try {
            return await FileModel.listDir(directory);
        } catch (error) {
            console.error(`Error listing files in ${directory}:`, error);
            return [];
        }
    }

    async checkFileExists(filePath: string, userId?: string): Promise<boolean> {
        // Check directory permissions first
        if (!this.isDirectoryAllowed(filePath, userId)) {
            return false;
        }
        
        return await FileModel.checkExists(filePath);
    }

    async hashFile(fileData: string | Buffer, userId?: string): Promise<string | null> {
        // If fileData is a path, check permissions
        if (typeof fileData === 'string' && !this.isDirectoryAllowed(fileData, userId)) {
            console.error(`Access denied to file ${fileData}`);
            return null;
        }
        
        try {
            return await FileModel.hashFile(fileData);
        } catch (error) {
            console.error(`Error hashing file:`, error);
            return null;
        }
    }
}

export const fileController = new FileController();