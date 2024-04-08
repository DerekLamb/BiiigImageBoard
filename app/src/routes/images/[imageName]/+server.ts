import { mainFileRepo } from "$lib/fileService";
import { error } from  "@sveltejs/kit"
import path from "path";

/** @type {import('./$types').RequestHandler} */

export async function GET ({ params, locals}){
    if(!locals.user){
        error(401, "Unauthorized");
    }

    if(!params.imageName){
        error(400, "invalid image request");
    }

    try{
        console.log(params.imageName);
        const imageBuffer = await mainFileRepo.readFile(params.imageName);
        const imageType = path.extname(params.imageName).substring(1); // need to build a better file type system
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