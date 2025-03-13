
import { fileController } from "$lib/server/controllers/fileController.js";
import { error } from  "@sveltejs/kit"
import path from "path";

/** @type {import('./$types').RequestHandler} */

export async function GET ({ params, locals}){
    if(!locals.user){
        error(401, "Unauthorized");
    }

    if(!params.slug){ // need to build a better file type system TODO
        error(400, "invalid image request");
    }

    try{
        console.log(params.slug);
        const imageBuffer = await fileController.getFile(params.slug); 
        const imageType = path.extname(params.slug).substring(1); 
        return new Response(imageBuffer, {
            headers: {
                'Content-Type': `image/${imageType}`,
                'Cache-Control': 'max-age=31536000, immutable'
            }
        })
    }
    catch(e){
        return new Response("Image not found", {status: 404});
    }
}