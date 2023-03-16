import fs from "fs";
import db from "$lib/db";
import promptDecode from "$lib/ExtractPrompt";

const projection = { fsName:1 }
const imgCol = db.collection('testimages')
const remCol = db.collection('remedialImages')

export async function checkFiles(dirPath: string){
    
    const result = await refreshFiles(dirPath);

    cleanupDB(dirPath, result.missingFiles);
    // TODO compare img to db based on hash 
    addNewFiles(dirPath, result.newFiles);

    embPromptGrab(dirPath);
}

export async function refreshFiles(dirPath: string){
    // compare file dir to db 
    // returns {"_id":_id, "fsName":fsName } from database
    const fileNames = await imgCol.find({}).project({_id:0, fsName:1}).toArray(); // returns {"_id":_id, "fsName":fsName } from database
    
    // grabs just fsName from returned mongo find query
    //const fileNames = imageNames.map((document) => document.fsName)

    // reads all file names in said directory
    const dirFiles = await fs.promises.readdir(dirPath);

    // filters based on missing matches from database perspective
    const missingFiles = fileNames.filter((fileName) => !dirFiles.includes(fileName));

    // filters based on missing matches from filename perspective
    const newFiles = dirFiles.filter((dirFile) => !fileNames.includes(dirFile));

    console.log( missingFiles );
    console.log( newFiles );
    return { 
        missingFiles,
        newFiles
    };
}

export async function embPromptGrab(dirPath: string, forceRecheck?: boolean){

    const noPromptQuery = (forceRecheck) ? { embPropmt:"" } : {};

    const noPromptReturn = await imgCol.find(noPromptQuery).project(projection).toArray();
    
    const noPromptFiles = noPromptReturn.map((document) => document.fsName);

    for(const filename in noPromptFiles){

        console.log(`Looking for prompt in ${filename}`);

            try {

                //read file data
                const file = await fs.promises.readFile(`images/${filename}`);
                
                // file for expected prompt
                const embPrompt  = promptDecode(file)?.prompt;
        
                console.log(embPrompt);
                console.log(filename);

                // add found embedded prompt to imageDB if one exists
                if(embPrompt){ imgCol.updateOne({ fsName: filename }, { $set:{ embPrompt: embPrompt } }, { upsert: false}); }

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
        // per filename in missingFiles, add imagedoc to remedial db. 
        // TODO in future add ability to decide whether to keep data or delete?
        const document = await db.collection('testimage').find({fsname:filename}).toArray();
        remCol.insertOne({name: document.name, fsName:filename, genName:document.genName, imagePath: `images/${filename}`, tags: document.tags, embPrompt:""});
        console.log(document);
        const result = await db.collection('testimage').deleteOne({fsName:filename});
        // if(result.deletedCount === 1){
        //     console.log(`Sucessfully deleted ${filename}`);
        // }
    }
}

export async function addNewFiles(dirPath: string, newFiles : Array<string>, fileData? : File){
    for( const filename of newFiles ){
        addNewFile(dirPath, filename)
        console.log(filename)
    }
}

export async function addNewFile(dirPath: string, newFile: string, fileData: buffer ,  destPath?:string, tags?: Array<string>){

    const genName = Date.now().toString();
    const imageName = `${genName}.${newFile.split('.').pop()}`;

    if(destPath){
        fs.rename(`${dirPath}/${newFile}`, `images/${imageName}`, () => {
            console.log(`new file added at images/${imageName}`);
        });
    }
    const result = await imgCol.insertOne({name: newFile, fsName:imageName, genName:genName, imagePath: `images/${imageName}`, tags: tags, embPrompt:""});

    fs.writeFileSync(`images/${fsName}`, buffer, "base64");
    db.collection('testimages').insertOne({name: files[i].name, fsName:fsName, genName:genName, imagePath: `images/${fsName}`, tags: files[i].tags, embPrompt:""});
}

export async function moveFile(movePath: string, fileName: string, tags?: Array<string>){

    const genName = Date.now().toString();

    const imageName = `${genName}.${newFile.split('.').pop()}`;

    try{

        const result = await imgCol.insertOne({name: newFile, fsName:imageName, genName:genName, imagePath: `images/${imageName}`, tags: tags, embPrompt:""});

        fs.rename(`${movePath}/${fileName}`, `images/${fileName}`, () => {
            console.log(`new file added at images/${imageName}`);
        });

    } catch(error) {

        console.log("Error encountered while moving file")
    
    }

}