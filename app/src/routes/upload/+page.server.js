import fs from "fs";
import db from "$lib/db"
import { checkFiles, embPromptGrab } from "$lib/processFiles";

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formdata = await request.formData(); // paused here until done? 
    const files = formdata.getAll("image");
    for (let i = 0; i < files.length; i++){

      if (!(files[i] instanceof Object) || !files[i].name){
        console.log("Error with file");
      } else {
        const buffer = Buffer.from(await files[i].arrayBuffer());
        const genName = Date.now().toString()
        const fsName = `${genName}.${files[i].name.split('.').pop()}`
        fs.writeFileSync(`images/${fsName}`, buffer, "base64");
        db.collection('testimages').insertOne({name: files[i].name, fsName:fsName, genName:genName, imagePath: `images/${fsName}`, tags: files[i].tags, embPrompt:""});
      }
    }
    checkFiles('images/');

    return { sucess: true, submitted: files.length };
  }
};