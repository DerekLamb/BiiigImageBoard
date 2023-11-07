import { checkFiles, addFile } from "$lib/processFiles";

/** @type {import('./$types').Actions} */
export const actions = {

  default: async ({ request }) => {

    const formdata = await request.formData(); 
    const files = formdata.getAll("image");
    for (let i = 0; i < files.length; i++){
      if (!(files[i] instanceof Object) || !files[i].name){
        console.log("Error with file"); // Log an error message if the file is invalid or has no name
      } else {
        const buffer = Buffer.from(await files[i].arrayBuffer());
        addFile(buffer, files[i].name, "images",[])
      }
    }
    checkFiles('images');
    return { sucess: true, submitted: files.length };
  }
};
