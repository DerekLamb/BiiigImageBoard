import { checkFiles, addFile } from "$lib/processFiles";

/** @type {import('./$types').Actions} */
// Define the actions object that maps HTTP methods to request handlers
export const actions = {
  // Define the default action for handling POST requests
  default: async ({ request }) => {
    // Parse the incoming form data from the request body
    const formdata = await request.formData(); // Note: this is an asynchronous function call that pauses until it resolves.
    // Extract all the files from the form data that have the name "image"
    const files = formdata.getAll("image");
    // Iterate over each file and process it
    for (let i = 0; i < files.length; i++){
      // Check if the file is valid and has a name property
      if (!(files[i] instanceof Object) || !files[i].name){
        console.log("Error with file"); // Log an error message if the file is invalid or has no name
      } else {
        // If the file is valid, convert it to a buffer and pass it to the addFile function along with its name and destination path
        const buffer = Buffer.from(await files[i].arrayBuffer());
        addFile(buffer, files[i].name, "images",[])
      }
    }
    // After processing all the files, run a check to update their metadata and generate embPrompt values
    checkFiles('images');
    // Return a success response along with the number of files submitted
    return { sucess: true, submitted: files.length };
  }
};
