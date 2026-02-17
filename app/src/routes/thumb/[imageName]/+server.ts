import {auth} from "$lib/auth.js"
import { fileController } from "$lib/server/controllers/fileController.js"
import { error, redirect } from  "@sveltejs/kit"
import path from "path";

/** @type {import('./$types').RequestHandler} */

export async function GET ({ params, locals, request}){
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }
    if(!params.imageName){
        error(400, "invalid image request");
    }

    try{
        const imageName = params.imageName;
        console.time(imageName);
        const imageBuffer = await fileController.getThumbnailFile(params.imageName);
        console.timeEnd(imageName);
        const imageType = path.extname(params.imageName).substring(1); // need to build a better file typing system
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