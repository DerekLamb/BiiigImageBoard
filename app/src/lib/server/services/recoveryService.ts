import { FileModel } from '../models/fileModel';
import { ImageModel, type AppImageData } from '../models/imageModel';
import { imageService } from './imageService';

// Supported file extensions
const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'webm'];
const ALL_SUPPORTED_EXTENSIONS = [...SUPPORTED_IMAGE_EXTENSIONS, ...SUPPORTED_VIDEO_EXTENSIONS];

export interface RecoveryOptions {
    imagesDir?: string;           // Default: 'images/'
    generateThumbnails?: boolean; // Default: true
    dryRun?: boolean;             // Default: false - just report what would be done
}

export interface RecoveryError {
    file: string;
    error: string;
}

export interface RecoverySummary {
    totalScanned: number;
    addedCount: number;
    skippedCount: number;
    errorCount: number;
}

export interface RecoveryResult {
    success: boolean;
    added: string[];
    skipped: string[];
    errors: RecoveryError[];
    summary: RecoverySummary;
}

/**
 * Extract timestamp from filename
 * Expected format: {timestamp}.{ext} where timestamp is a number
 * e.g., 1708123456789.jpg
 */
function extractTimestampFromFilename(filename: string): string | null {
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    const timestamp = parseInt(nameWithoutExt, 10);
    
    // Validate it's a reasonable timestamp (after year 2000 in milliseconds)
    if (isNaN(timestamp) || timestamp < 946684800000) {
        return null;
    }
    
    return nameWithoutExt;
}

/**
 * Determine if file is a video based on extension
 */
function isVideoFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Check if file has a supported extension
 */
function isSupportedFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ALL_SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Recovery service for adding orphaned image files to the database
 */
export const recoveryService = {
    /**
     * Scan the images directory and add any files not already in the database
     */
    async recoverImages(options: RecoveryOptions = {}): Promise<RecoveryResult> {
        const {
            imagesDir = 'images/',
            generateThumbnails = true,
            dryRun = false
        } = options;

        const result: RecoveryResult = {
            success: true,
            added: [],
            skipped: [],
            errors: [],
            summary: {
                totalScanned: 0,
                addedCount: 0,
                skippedCount: 0,
                errorCount: 0
            }
        };

        try {
            // Get list of all files in images directory
            let files: string[];
            try {
                files = await FileModel.listDir(imagesDir);
            } catch (error) {
                result.success = false;
                result.errors.push({
                    file: imagesDir,
                    error: `Failed to read directory: ${error}`
                });
                result.summary.errorCount = 1;
                return result;
            }

            // Filter to only supported image/video files
            const imageFiles = files.filter(file => isSupportedFile(file));
            result.summary.totalScanned = imageFiles.length;

            console.log(`[Recovery] Found ${imageFiles.length} supported files in ${imagesDir}`);

            // Process each file
            for (const filename of imageFiles) {
                const filePath = `${imagesDir}${filename}`;
                
                try {
                    // Read file and generate hash
                    const buffer = await FileModel.read(filePath);
                    const hash = await FileModel.hashFile(buffer);

                    // Check if this hash already exists in database
                    const existingCount = await ImageModel.uniqueHash(hash);
                    if (existingCount > 0) {
                        result.skipped.push(filePath);
                        result.summary.skippedCount++;
                        console.log(`[Recovery] Skipped (exists): ${filePath}`);
                        continue;
                    }

                    // Extract timestamp from filename
                    const timestamp = extractTimestampFromFilename(filename);
                    if (!timestamp) {
                        result.errors.push({
                            file: filePath,
                            error: 'Could not extract valid timestamp from filename'
                        });
                        result.summary.errorCount++;
                        console.log(`[Recovery] Error (invalid filename): ${filePath}`);
                        continue;
                    }

                    // Determine file type
                    const type: 'image' | 'video' = isVideoFile(filename) ? 'video' : 'image';
                    const ext = filename.split('.').pop() || '';

                    // Create image document
                    const imageData: AppImageData = {
                        _id: hash,
                        type: type,
                        originalName: filename,
                        sanitizedFilename: filename,
                        imagePath: `images/${filePath}`,
                        uploadDate: timestamp,
                        thumbnailPath: '',
                        group: [],
                        tags: []
                    };

                    if (dryRun) {
                        // In dry-run mode, just log what would be done
                        result.added.push(filePath);
                        result.summary.addedCount++;
                        console.log(`[Recovery] DRY RUN - Would add: ${filePath}`);
                    } else {
                        // Add to database
                        const addResult = await ImageModel.addImage(imageData);
                        
                        if (!addResult.success) {
                            result.errors.push({
                                file: filePath,
                                error: 'Failed to insert into database'
                            });
                            result.summary.errorCount++;
                            console.log(`[Recovery] Error (db insert failed): ${filePath}`);
                            continue;
                        }

                        result.added.push(filePath);
                        result.summary.addedCount++;
                        console.log(`[Recovery] Added: ${filePath}`);

                        // Generate thumbnail if requested
                        if (generateThumbnails) {
                            try {
                                if (type === 'video') {
                                    // Video thumbnails are generated from file path, pass true to overwrite
                                    await imageService.updateVideoThumbnail(imageData, true);
                                } else {
                                    await imageService.updateThumbnail(imageData, buffer);
                                }
                                console.log(`[Recovery] Thumbnail created: ${filePath}`);
                            } catch (thumbError) {
                                // Thumbnail failure shouldn't fail the whole recovery
                                console.log(`[Recovery] Warning - Thumbnail failed for ${filePath}: ${thumbError}`);
                            }
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    result.errors.push({
                        file: filePath,
                        error: errorMessage
                    });
                    result.summary.errorCount++;
                    console.log(`[Recovery] Error processing ${filePath}: ${errorMessage}`);
                }
            }

            console.log(`[Recovery] Complete. Added: ${result.summary.addedCount}, Skipped: ${result.summary.skippedCount}, Errors: ${result.summary.errorCount}`);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.success = false;
            result.errors.push({
                file: 'recovery',
                error: `Unexpected error: ${errorMessage}`
            });
            result.summary.errorCount++;
            return result;
        }
    }
};
