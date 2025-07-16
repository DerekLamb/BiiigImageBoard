import { fileUtilService } from "$lib/imageService"
import imageController from "$lib/server/controllers/imageController.js";
import { type AppImageData } from "$lib/server/models/imageModel.js";

/** @type {import('./$types').Actions} */


export const actions = {

    default: async ({ request }) => {
        const formdata = await request.formData(); 
        const files = formdata.getAll("image").filter(file => file instanceof File && file.name) as File[]; // readabliity fix TODO;
        const baseTimestamp = Date.now().toString();
        await Promise.all(files.map(async (file, index) => {
            try {
                let sequentialTimestamp = (parseInt(baseTimestamp) + index).toString();
                imageController.newImage(file, sequentialTimestamp);
                
            } catch (error) {
                return { sucess: false, error: `Error processing file ${file.name}: ${error}` };
            }
        }));

        return { sucess: true, submitted: files.length };
    }
};


