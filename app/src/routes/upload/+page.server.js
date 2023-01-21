import fs from "fs";
import db from "$lib/db"

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
        const fsName = `${Date.now()}.${files[i].name.split('.').pop()}`
        fs.writeFileSync(`images/${fsName}`, buffer, "base64");
        db.collection('testimages').insertOne({name: files[i].name, fsName:fsName, imagePath: `images/${fsName}`, tags: files[i].tags });
      }
    }

    return { sucess: true, submitted: files.length };
  }
};