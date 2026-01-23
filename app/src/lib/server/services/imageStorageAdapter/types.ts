import type { FileOperationResult } from "$lib/types/services";
import type { AppImageData } from "$lib/server/models/imageModel";

export interface imageStorageAdapter {
    /**
     * Writes an image file to storage
     */
    writeImage(filePath: string, data: Buffer): Promise<FileOperationResult>;

    /**
     * Reads an image file from storage
     */
    readImage(filePath: string): Promise<Buffer>;

    /**
     * Deletes an image file from storage
     */
    deleteImage(filePath: string): Promise<FileOperationResult>;

    /**
     * Deletes a thumbnail file from storage
     */
    deleteThumbnail(filePath: string): Promise<FileOperationResult>;

    /**
     * Checks if a file exists in storage
     */
    fileExists(filePath: string): Promise<boolean>;
}

export interface imageProcessingAdapter {
    /**
     * Creates a thumbnail for an image
     */
    createThumbnail(imageData: AppImageData, buffer: Buffer): Promise<boolean>;

    /**
     * Creates a thumbnail for a video
     */
    createVideoThumbnail(imageData: AppImageData): Promise<boolean>;
}
