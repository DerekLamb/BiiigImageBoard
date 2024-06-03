import { fileUtilService } from "$lib/imageService"
import imageController from "$lib/server/controllers/imageController.js";

import { type AppImageData } from "$lib/server/types";

// async function checkFiles(){
//     const filelist = await mainFileRepo.updateFiles()
//     const dblist = await imageRepo.get();
//     const dbFileNames = dblist.map((document) => document.sanitizedFilename);
//     const dirFileNames = Array.from(filelist.keys());

//     const missingFiles = dbFileNames.filter( file => !dirFileNames.includes(file));
//     const missingDB = dirFileNames.filter( file => !dbFileNames.includes(file));
//     await Promise.all(missingDB.map( async file => {
//         imageRepo.create(
//             file.toString(),
//             file,
//             file.split('.')[0], // need to build a better file type system 
//             "images",
//             "",
//             await hashFile(`images/${file}`),
//         )
//         console.log(file)
//     }))
// }

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


