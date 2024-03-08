import {mainFileRepo, thumbFileRepo} from "$lib/fileService"
import {imageRepo} from "$lib/imageRepository"
import { hashFile } from "$lib/processFiles.js";
import { fileUtilService } from "$lib/fileUtilityService.js";
import { v4 as uuidv4 } from 'uuid';


async function checkFiles(){
    const filelist = await mainFileRepo.updateFiles()
    const dblist = await imageRepo.get();
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
        await Promise.all(files.map(async file => {
            if (!(file instanceof Object) || !file.name) {
                console.log("Error processing file attributes/data");
            } else {
                try {
                    const randomString = uuidv4().replace(/-/g, '').substring(0,8);
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const hash = await fileUtilService.hashFile(buffer);
                    const [ base, ext ] = file.name.split('.');
                    const timestamp = `${Date.now().toString()}-${randomString}`;
                    const newFileName = `${timestamp}.${ext}`;
                    const dbResults = await imageRepo.create(file.name, newFileName, timestamp, "images", "", hash)
                    if(dbResults){
                        await mainFileRepo.addFile(newFileName, buffer);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }));

        try{
            console.log("Checking for missing files")
            console.log( await fileUtilService.compareDBToDir(imageRepo));
            fileUtilService.missingThumbAll(imageRepo, thumbFileRepo);
            fileUtilService.extractPromptAll(imageRepo);
        } catch (error) {
            console.log(error);
        }

        return { sucess: true, submitted: files.length };
    }
};


