import { checkFiles, addFile } from "$lib/processFiles";
import {mainFileRepo} from "$lib/fileService"
import fs from "fs/promises"

    /** @type {import('./$types').Actions} */


    export const actions = {

        default: async ({ request }) => {
            const formdata = await request.formData(); 
            const files = formdata.getAll("image");

            const uploadPromises = files.map(async file => {
                if (!(file instanceof File) || !file.name) {
                    console.log("Error processing file attributes/data");
                    return;
                }
    
                try {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    await mainFileRepo.memAddFile(file.name, buffer)
                } catch (error) {
                    console.log(error.stack);
                }
            });

            await Promise.all(uploadPromises);
            //checkFiles('images');
            return { sucess: true, submitted: files.length };
        }
    };