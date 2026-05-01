import imageController from "$lib/server/controllers/imageController.js";
import { imageProcessor } from "$lib/server/services/taskQueue/imageProcessor.js";
import { type AppImageData } from "$lib/server/models/imageModel.js";

/** @type {import('./$types').Actions} */

export const actions = {
    default: async ({ request }) => {
        const formdata = await request.formData();
        const files = formdata.getAll("image").filter(file => file instanceof File && file.name) as File[]; // readabliity fix TODO;
        const baseTimestamp = Date.now().toString();
        
        // Process uploads without waiting for thumbnails
        // The upload completes quickly, thumbnails are generated in the background
        const uploadResults = await Promise.allSettled(files.map(async (file, index) => {
            try {
                let sequentialTimestamp = (parseInt(baseTimestamp) + index).toString();
                await imageController.newImage(file, sequentialTimestamp);
            } catch (error) {
                return { success: false, error: `Error processing file ${file.name}: ${error}` };
            }
        }));

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


