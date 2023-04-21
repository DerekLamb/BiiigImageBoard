import fs from "fs";
import db from "$lib/db";
import promptDecode from "$lib/ExtractPrompt";
import sharp from "sharp";

const projection = { fsName:1 }
const imgCol = db.collection('testimages')
const remCol = db.collection('remedialImages')

export async function checkFiles(dirPath: string){
    
    const result = await refreshFiles(dirPath);
    // console.log("Missing Files: ");
    // console.log(result.missingFiles);
    console.log("New Files: ");
    console.log(result.newFiles);
    cleanupDB(dirPath, result.missingFiles);
    // TODO compare img to db based on hash 
    moveFiles(dirPath, result.newFiles);

    // embPromptGrab(dirPath);
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

    const noPromptQuery = (forceRecheck) ? { embPropmt:"" } : {};

    const noPromptReturn = await imgCol.find(noPromptQuery).project(projection).toArray();
    
    const noPromptFiles = noPromptReturn.map((document) => document.fsName);

    for(const filename in noPromptFiles){

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
                    console.log(`Missing file with filename ${filename}`);
                } else {

                    //Throw unexpected error
                    console.error(error);
                }
            }

    }
}

export async function cleanupDB(dirPath: string, missingFiles : Array<string>){
    for( const filename of missingFiles ){
        // per filename in missingFiles, move imagedoc to remedial db. 

        console.log("filename is " + filename);
        // console.log((await db.collection('testimages').find().toArray()).map(document => document.fsName));
        const document = await imgCol.findOne({ fsName:filename });
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
}

export async function moveFiles(dirPath: string, newFiles : Array<string>, fileData? : File){
    for( const filename of newFiles ){
        moveFile(dirPath, filename, dirPath);
        console.log(filename);
    }
}

export async function moveFile(dirPath: string, fileName: string, destPath: string, tags?: Array<string>) {
    const [ base, ext ] = fileName.split('.');
    const timestamp = base.match(/\b\d{13}\b/) ? base : `${Date.now().toString()}`;
    const imageName = `${timestamp}.${ext}`;

    
    fs.renameSync(`${dirPath}/${fileName}`, `${destPath}/${imageName}`)
    console.log(`file ${fileName} moved to ${destPath}/${imageName}`);

    const dbResult = await imgCol.insertOne({ // Insert the file metadata into the database.
        name: fileName, 
        fsName: imageName, 
        genName: timestamp, 
        imagePath: `${destPath}/${imageName}`, 
        tags: tags, 
        embPrompt: ""
    });

}

export async function addFile(fileStream: Buffer, fileName:string, imagePath:string, tags?:Array<string>){
    const [ base, ext ] = fileName.split('.');
    const timestamp = base.match(/\b\d{13}\b/) ? base : `${Date.now().toString()}`;
    const fsName = `${timestamp}.${ext}`

    try{
        const result = await imgCol.insertOne({name: fileName, fsName:fsName, genName:timestamp, imagePath: `${imagePath}/${fsName}`, tags: tags, embPrompt:""});

        fs.writeFileSync(`${imagePath}/${fsName}`, fileStream, 'base64');
        
        console.log(`File ${fileName} written to DB and filesystem`)
    } 
    catch(error) {

        console.error(`Error encountered writing file ${fileName} to DB and filesystem`);
        console.error(error);
    
    }

}

export async function createThumbnail(dirPath: string, imageName: string, outputPath: string){
    await sharp(`${dirPath}/${imageName}`)
        .resize(400)
        .toFile(`${outputPath}/${imageName}`)
}