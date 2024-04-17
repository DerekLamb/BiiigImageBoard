import fs from "fs/promises";
import { redirect } from "@sveltejs/kit";
import { fileUtilService, imageRepo, type ImageData } from "$lib/imageService"
import { ObjectId } from "mongodb";

/** @type {import('./$types').Actions} */


export const load = async (event) => {
    if(!event.locals.user){
        redirect(307, '/login');
    }
    if(event.locals.user.username !== "admin"){
        // handle here if no admin TODO
        redirect(307, '/login');
    }
    return{
        username: event.locals.user.username
    }
}

export const actions = {

  default: async ({ locals , request }) => {

    if ( !locals.user ){
        redirect(307, '/login');
    }

    try {
        //const body = request.body;
        
        let [ missingFiles, missingDB ]  = await fileUtilService.compareDBToDir();
        if ( missingDB.length > 0 || missingDB instanceof Array ){
            const baseTimestamp = Date.now().toString();
            await Promise.all(missingDB.map(async (file, index) => {
                try {
                    // add if statement to check file size too large
                    
                    const buffer = await fs.readFile(`images/${file}`);
                    const hash = await fileUtilService.hashFile(buffer);
                    const ext  = file.split('.').pop();
                    const sequentialTimestamp = (parseInt(baseTimestamp) + index).toString();
                    const newFileName = `${sequentialTimestamp}.${ext}`;

                    const imageDataObj : ImageData = {
                        _id: new ObjectId(hash),
                        originalName: file as string, // need more research on String vs string
                        sanitizedFilename: newFileName,
                        imagePath: `images/${newFileName}`, 
                        uploadDate: sequentialTimestamp,
                        thumbnailPath: "",
                        tags: null,
                    }
    
                    const dbResults = await imageRepo.create(imageDataObj)
                    if(dbResults){
                        fs.rename(`images/${file}`, `images/${newFileName}`); // rename file
                        fileUtilService.createThumbnail(imageDataObj, buffer);
                    }
                } catch (error) {
                    console.error("Error processing file", file, error);
                }
            }));
        }
        
    } 
    catch (error) {
        console.error(error);
        return {
            status: 500,
            headers: {
                'content-type': 'application/json'
                },
            error: 'Internal server error'
        }
    }
  
  
    return {
        status: 200,
        headers: {'content-type': 'application/json'},
        body: { message: "Images Checked!" }
    };
    }
}