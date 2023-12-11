import {mainFileRepo} from "$lib/fileService"
import {imageRepo} from "$lib/imageRepository"
import { hashFile } from "$lib/processFiles.js";


    async function checkFiles(){
        const filelist = await mainFileRepo.updateFiles()
        const dblist = await imageRepo.getAll();
        const dbFileNames = dblist.map((document) => document.sanitizedFilename);
        const dirFileNames = Array.from(filelist.keys());

        const missingFiles = dbFileNames.filter( file => !dirFileNames.includes(file));
        const missingDB = dirFileNames.filter( file => !dbFileNames.includes(file));
        await Promise.all(missingDB.map( async file => {
            imageRepo.create(
                file,
                file,
                file.split('.')[0],
                "images",
                "",
                await hashFile(`images/${file}`),
            )
            console.log(file)
        }))
    }

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
                        const buffer =  Buffer.from(await file.arrayBuffer());
                        const hash = await hashFile(buffer);
                        const [ base, ext ] = file.name.split('.');
                        const timestamp = base.match(/\b\d{13}\b/) ? base : `${Date.now().toString()}`;
                        const newFileName = `${timestamp}.${ext}`

                        
                        const dbResults = await imageRepo.create(file.name, newFileName, timestamp, "images", "", hash)
                        if(dbResults){
                            await mainFileRepo.addFile(newFileName, buffer);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                    
                }
            }))

            //checkFiles();
            return { sucess: true, submitted: files.length };
        }
    };


