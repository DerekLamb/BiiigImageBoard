import fs from "fs";
import { db } from "$lib/db";
import {ObjectId} from 'mongodb';
import promptDecode from "$lib/ExtractPrompt";
import sharp from "sharp";
import crypto from "crypto";


const projection = { fsName:1 }
const imgCol = db.collection('testimages')
const remCol = db.collection('remedialImages')

async function ensureDirExists(dirPath: string) {
    try {
        await fs.promises.access(dirPath, fs.constants.F_OK);
    } catch (error) {
        if (error.code === 'ENOENT') {
            try {
                await fs.promises.mkdir(dirPath, { recursive: true });
            } catch (err) {
                throw err;
            }
        } else {
            throw error;
        }
    }
}

export async function checkFiles(dirPath: string){
    
    const result = await refreshFiles(dirPath);
    // console.log("Missing Files: ");
    // console.log(result.missingFiles);
    console.log("New Files: ");
    console.log(result.newFiles);
    cleanupDB(result.missingFiles);
    // TODO compare img to db based on hash 
    moveFiles(dirPath, result.newFiles);
    // search new images for embedded prompts from stable diffusion
    embPromptGrab(dirPath, false);
}

export async function refreshFiles(dirPath: string){
    // compare file dir to db 
    // returns {"_id":_id, "fsName":fsName } from database
    const imageNames = await imgCol.find({}).project(projection).toArray(); // returns {"fsName":fsName } from database
    // grabs just fsName from returned mongo find query
    const fileNames = imageNames.map((document) => document.fsName)

    // reads all file names in said directory
    const dirFiles = fs.readdirSync(dirPath);

    // filters based on missing matches from database perspective
    const missingFiles = fileNames.filter((fileName) => !dirFiles.includes(fileName));

    // filters based on missing matches from filename perspective
    const newFiles = dirFiles.filter((dirFile) => !fileNames.includes(dirFile));

    return { 
        missingFiles,
        newFiles
    };
}

export async function embPromptGrab(dirPath: string, forceRecheck? : boolean){

    const noPromptQuery = (!forceRecheck) ? { embPrompt:"" } : {};

    const noPromptReturn = await imgCol.find(noPromptQuery).project(projection).toArray();

    const noPromptFiles = noPromptReturn.map((document) => document.fsName);
    
    for(const filename of noPromptFiles){

        console.log(`Looking for prompt in ${filename}`);

            try {

                //read file data
                const file = await fs.promises.readFile(`${dirPath}/${filename}`);
                
                // file for expected prompt
                const embPrompt  = promptDecode(file)?.prompt;

                // add found embedded prompt to imageDB if one exists
                if(embPrompt){ 
                    imgCol.updateOne({ fsName: filename }, { $set:{ embPrompt: embPrompt } }, { upsert: false}); 
                    console.log("embPrompt found for image: " + filename)
                }

            } catch (error) {

                //Match error to missing file error. 
                if(error.code === 'ENOENT'){

                    //Catch error and continue with next file
                    console.log(`Missing file with filename ${dirPath}/${filename}`);
                } else {

                    //Throw unexpected error
                    console.error(error);
                }
            }

    }
}

export async function cleanupDB( missingFiles : Array<string>){
    for( const filename of missingFiles ){
        // per filename in missingFiles, move imagedoc to remedial db. 

        console.log("filename is " + filename);
        // console.log((await db.collection('testimages').find().toArray()).map(document => document.fsName));
        const document = await imgCol.findOne({ fsName:filename });
        if(document){
            remCol.insertOne(document);
            console.log("document is " + document);
            const result = await imgCol.deleteOne({ name:document.name });
            if(result.deletedCount === 1){
                console.log(`Sucessfully deleted ${filename}`);
            }
            else{
                console.log(`Failed to delete ${filename}`);
            }
        } 
        else{ 
            console.log(`${filename} not found inside DB`);
        }

    }
}

export async function hashFile(file: string | Buffer): Promise<string> {
    let buffer: Buffer;

    if (typeof file === 'string') {
        buffer = fs.readFileSync(file);
    } else if (typeof file === 'object' && file instanceof Buffer) {
        buffer = file;
    } else {
        throw new Error('Invalid input. Expecting string or Buffer.');
    }

    try {
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        const fsHash = hash.digest('base64').slice(0,12);
        return fsHash;
    } catch (error: any) {
        throw new Error('Error while hashing file: ' + error.message);
    }
}
//TODO:
// 1. **Batch database operations `bulkWrite`

// 2. **Better Error handling

export async function moveFiles(dirPath: string, newFiles : Array<string>, fileData? : File){
    for( const filename of newFiles ){
        moveFile(dirPath, filename, dirPath);
        console.log(filename);
    }
}

export async function moveFile(dirPath: string, fileName: string, destPath: string, tags?: Array<string>) {
    const [ base, ext ] = fileName.split('.'); // could heavily improve... TODO!!
    const timestamp = base.match(/\b\d{13}\b/) ? base : `${Date.now().toString()}`;
    const imageName = `${timestamp}.${ext}`;
    const fileHash = await hashFile(`${dirPath}/${fileName}`);
    


    try{
        const dbResult = await imgCol.insertOne({ // Insert the file metadata into the database.
            _id: new ObjectId(fileHash),
            name: fileName,
            fsName: imageName, 
            genName: timestamp, 
            imagePath: `${destPath}/${imageName}`, 
            tags: tags, 
            embPrompt: ""
        });

        fs.renameSync(`${dirPath}/${fileName}`, `${destPath}/${imageName}`)
        console.log(`file ${fileName} moved to ${destPath}/${imageName}`);
    }
    catch(error){
        if(error.code === 11000){
            console.error("Duplicate file error, file ignored");
        }else{
            throw error;
        }
    }

}

export async function addFile(fileStream: Buffer, fileName:string, imagePath:string, tags?:Array<string>){
    const [ base, ext ] = fileName.split('.');
    const timestamp = base.match(/\b\d{13}\b/) ? base : `${Date.now().toString()}`;
    const fsName = `${timestamp}.${ext}`
    const fsHash = await hashFile(fileStream);

    try{
        const result = await imgCol.insertOne({
            _id: new ObjectId(fsHash), 
            name: fileName, 
            fsName:fsName, 
            genName:timestamp, 
            imagePath: `${imagePath}/${fsName}`, 
            tags: tags, embPrompt:""});
        console.log(`File ${fileName} written to DB and filesystem`)
    } catch(error) {

        if (error.code === 11000) {
            console.error("Duplicate file error, file ignored");
        } else {
            throw error;
        }
    
    }

}

export async function deleteFile(fileName: string){
    // switch(typeof file){
    //     case 'string':
        
    //     break;
    //     case 'buffer':

    //     break;
    //     case 'ObjectId':

    //     break;
    //     default:
    //         console.log("Error, type file");
    // }
    // I want to deal with this by deleting a file by a unique modifier, possibly by _id. It would be very useful deleteOne would return a document I could then derive a path from.

    // imgCol.deleteOne({genName:fileName} )
    

    // fs.unlink(`${fName}`, (err) => {
    //     console.log(`${fName}`)
    //     if(err) throw err;
    //     console.log(`deleted ${fName}`)
    // });
}

export async function createThumbnail(dirPath: string, image: any, outputPath: string, thumbWidth: number, thumbHeight: number){
        const thumbName = `${image.genName}_thmb.webp`;
        const inputPath = `${dirPath}/${image.fsName}`;
        const thumbPath = `${outputPath}/${thumbName}`;
      
        // Resize image to fit within specified dimensions with crop to fill
        try {
            await sharp(inputPath)
                .resize({
                    width: thumbWidth,
                    height: thumbHeight,
                    fit: 'cover',
                    position: 'center'
                })
                .webp()
                .toFile(thumbPath);
        } catch (error) {
                console.error(error);
                console.log(image.genName);
        }
        
        // Update image document with thumbnail path
        await imgCol.updateOne({ fsName: image.fsName }, { $set:{ thumbPath: thumbPath } }, { upsert: true }); 
}
      
export async function createMissingThumbnails(dirPath: string, outputPath: string, thumbWidth: number = 200, thumbHeight: number = 200){
    ensureDirExists(dirPath)
    .then(() => console.log('Directory exists or has been created'))
    .catch(error => console.error(error));
    //find all images missing thumbnail
    const results = await imgCol.find({ 
        $or: [
        {thumbPath: ""},
        {thumbPath: {$exists:false}}
        ]
    }).toArray()

    for(const image of results){
        try{
            createThumbnail(dirPath, image, outputPath, thumbWidth, thumbHeight);
        }
        catch(error){
            console.error(`Error encountered writing file ${image.name} to DB and filesystem`);
            console.error(error);
        }
    }
}