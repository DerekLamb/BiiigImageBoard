import fs from "fs";
import db from "$lib/db"
import promptDecode from "$lib/ExtractPrompt"

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formdata = await request.formData(); // paused here until done? 
    const files = formdata.getAll("image");
    for (let i = 0; i < files.length; i++){

      if (!(files[i] instanceof Object) || !files[i].name){
        console.log("Error with file");
      } else {
        // console.log(files[i]);
        const buffer = Buffer.from(await files[i].arrayBuffer());
        console.log(promptDecode(buffer))
        const genName = Date.now().toString()
        const fsName = `${genName}.${files[i].name.split('.').pop()}`
        fs.writeFileSync(`images/${fsName}`, buffer, "base64");
        // console.log(`${fsName}, ${files[i]}`)
        db.collection('testimages').insertOne({name: files[i].name, fsName:fsName, genName:genName, imagePath: `images/${fsName}`, tags: files[i].tags, embPrompt:""});
      }
    }

    return { sucess: true, submitted: files.length };
  }
};