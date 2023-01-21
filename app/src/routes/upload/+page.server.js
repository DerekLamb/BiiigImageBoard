import fs from "fs";

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formdata = await request.formData();

    const file = formdata.get("image");

    if (!(file instanceof Object) || !file.name) {
    //   return invalid(400, { missing: true });

        console.log("Issue with file uploaded");
        return { success : false };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(`uploads/${Date.now()}.png`, buffer, "base64");
    //call function to upload to database here 
    console.log(buffer);
    return { filename: file.name };
  },
};