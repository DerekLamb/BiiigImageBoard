import {mainFileRepo, thumbFileRepo} from "$lib/fileService"
import {imageRepo, fileUtilService, fileService, type ImageData} from "$lib/imageService"
import { ObjectId } from "mongodb"


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
        const files = formdata.getAll("image").filter(file => file instanceof File && file.name) as Blob[]
        const baseTimestamp = Date.now().toString();
        await Promise.all(files.map(async (file, index) => {
                try {
                    // add if statement to check file size too large
                    
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const hash = await fileUtilService.hashFile(buffer);
                    const ext = file.name.split('.').pop();
                    const sequentialTimestamp = (parseInt(baseTimestamp) + index).toString();
                    const newFileName = `${sequentialTimestamp}.${ext}`;

                    const imageDataObj : ImageData = {
                        _id: new ObjectId(hash),
                        originalName: file.name,
                        sanitizedFilename: newFileName,
                        imagePath: `images/${newFileName}`, 
                        uploadDate: sequentialTimestamp,
                        thumbnailPath: "",
                        tags: null,
                    }
    
                    const dbResults = await imageRepo.create(imageDataObj)
                    if(dbResults){
                        fileService.saveImage(imageDataObj, buffer);
                        fileUtilService.createThumbnail(imageDataObj, buffer);
                    }
                } catch (error) {
                    console.error("Error processing file", file.name, error);
                }
        }));

        return { sucess: true, submitted: files.length };
    }
};


