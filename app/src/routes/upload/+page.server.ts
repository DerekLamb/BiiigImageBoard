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
            const buffer = Buffer.from(await file.arrayBuffer());
            mainFileRepo.addFile(file.name, buffer);
        }
    }))

    //checkFiles('images');
    return { sucess: true, submitted: files.length };
    }
    };
