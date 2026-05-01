import imageController from "$lib/server/controllers/imageController.js";
import { imageProcessor } from "$lib/server/services/taskQueue/imageProcessor.js";
import { type AppImageData } from "$lib/server/models/imageModel.js";

// Upload configuration constants
const UPLOAD_BATCH_SIZE = 10;          // Process 10 files at a time to control memory/concurrency
const MAX_UPLOAD_COUNT = 5000;         // Max files per request to prevent abuse
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file limit
const BATCH_DELAY_MS = 50;             // Delay between batches to allow GC

/** @type {import('./$types').Actions} */

export const actions = {
    default: async ({ request }) => {
        const formdata = await request.formData();
        const files = formdata.getAll("image").filter(file => file instanceof File && file.name) as File[]; // readabliity fix TODO;
        const baseTimestamp = Date.now().toString();

        // Validate upload limits before processing
        if (files.length > MAX_UPLOAD_COUNT) {
            return {
                success: false,
                submitted: 0,
                errors: [`Too many files: ${files.length}. Maximum is ${MAX_UPLOAD_COUNT}.`]
            };
        }

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return {
                    success: false,
                    submitted: 0,
                    errors: [`File "${file.name}" exceeds size limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`]
                };
            }
        }

        // Process uploads in batches to control memory usage and concurrency
        // This prevents overwhelming disk I/O, database connections, and Node.js heap
        const uploadResults: PromiseSettledResult<{ success: boolean; error?: string } | undefined>[] = [];

        for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
            const batch = files.slice(i, i + UPLOAD_BATCH_SIZE);
            const batchResults = await Promise.allSettled(batch.map(async (file, index) => {
                try {
                    const globalIndex = i + index;
                    const sequentialTimestamp = (parseInt(baseTimestamp) + globalIndex).toString();
                    await imageController.newImage(file, sequentialTimestamp);
                } catch (error) {
                    return { success: false, error: `Error processing file ${file.name}: ${error}` };
                }
            }));
            uploadResults.push(...batchResults);

            // Small delay between batches to allow GC and prevent CPU spikes
            if (i + UPLOAD_BATCH_SIZE < files.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        // Queue thumbnail generation for all uploaded images (non-blocking)
        // This runs in the background and won't block the upload response
        // Using processAllImages which processes in batches to avoid overloading the system
        imageProcessor.processAllImages().catch(err => {
            console.error("Thumbnail processing failed:", err);
        });

        // Check if all uploads succeeded
        const allSuccess = uploadResults.every(
            result => result.status === "fulfilled" && result.value?.success !== false
        );

        if (!allSuccess) {
            const errors = uploadResults
                .filter(result => result.status === "rejected" || (result.status === "fulfilled" && result.value?.success === false))
                .map(result => {
                    if (result.status === "rejected") return `Upload rejected: ${result.reason}`;
                    return result.value?.error || "Unknown error";
                });
            return { success: false, submitted: 0, errors };
        }

        return { success: true, submitted: files.length };
    }
};


