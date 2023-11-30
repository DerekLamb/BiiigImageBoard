import { checkFiles, addFile } from "$lib/processFiles";
import {mainFileRepo} from "$lib/fileService"

    /** @type {import('./$types').Actions} */


    export const actions = {

        default: async ({ request }) => {

            const formdata = await request.formData(); 
            const files = formdata.getAll("image");
            await Promise.all(files.map( async file => {
                if(!(file instanceof Object) || !file.name){
                    console.log("Error processing file attributes/data")
                } else {
                    
                    try{
                        const buffer = Buffer.from(await file.arrayBuffer());
                        await mainFileRepo.addFile(file.name, buffer);
                    } catch (error) {
                        console.log(error.stack);
                    }
                    
                }
            }))

            //checkFiles('images');
            return { sucess: true, submitted: files.length };
        }
    };