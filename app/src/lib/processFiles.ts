import fs from "fs";
import db from "$lib/db";
import promptDecode from "$lib/ExtractPrompt";
const projection = { fsName:1 }

export async function checkFiles(dirPath: string){
    const result = await refreshFiles(dirPath);
    cleanupDB(dirPath, result.missingFiles);
    addNewFiles(dirPath, result.newFiles);
    embPromptGrab(dirPath);
    
}


export async function refreshFiles(dirPath: string){
    // compare file dir to db 

    // returns {"_id":_id, "fsName":fsName } from database
    const imageNames = await db.collection('testimages').find({}).project(projection).toArray(); // returns {"_id":_id, "fsName":fsName } from database
    
    // grabs just fsName from returned mongo find query
    const fileNames = imageNames.map((document) => document.fsName)

    // reads all file names in said directory
    const dirFiles = await fs.promises.readdir(dirPath);

    // filters based on missing matches from database 
    const missingFiles = fileNames.filter((fileName) => !dirFiles.includes(fileName));

    // filters based on missing matches from filename    
    const newFiles = dirFiles.filter((dirFile) => !fileNames.includes(dirFile));
    console.log( missingFiles );
    console.log( newFiles );
    return { 
        missingFiles,
        newFiles
    };
}

export async function embPromptGrab(dirPath: string){
    const noPromptDB = await db.collection('testimages').find({ embPrompt: ""}).project(projection).toArray()
    
    const noPromptFiles = noPromptDB.map((document) => document.fsName)

    for ( const filename of noPromptFiles ){
        console.log("running embPrompt on file")
        const file = await fs.promises.readFile(`images/${filename}`); //possible issue? 
        const embPrompt  = promptDecode(file)?.prompt;
        console.log(embPrompt);
        console.log(filename)
        db.collection('testimages').updateOne({ fsName: filename }, {$set:{ embPrompt: embPrompt }}, { upsert: false});
    }
}

export async function cleanupDB(dirPath: string, missingFiles : Array<string>){
    for( const filename of missingFiles ){
        const result = await db.collection('testimage').deleteOne({fsName:filename});
        if(result.deletedCount === 1){
            console.log(`Sucessfully deleted ${filename}`);
        }
    }
}

export async function addNewFiles(dirPath: string, newFiles : Array<string>){
    for( const filename of newFiles){
        const genName = Date.now().toString()
        const fsName = `${genName}.${filename.split('.').pop()}`
        const result = await db.collection('testimages').insertOne({name: filename, fsName:fsName, genName:genName, imagePath: `images/${fsName}`, tags: undefined, embPrompt:""});
        fs.rename(`${dirPath}/${filename}`, `images/${fsName}`, () => {
            console.log(`new file added at images/${fsName}`);
        });
    }
}