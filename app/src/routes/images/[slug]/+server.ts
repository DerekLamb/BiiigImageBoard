import { auth } from "$lib/auth"
import { fileController } from "$lib/server/controllers/fileController.js";
import { error, redirect } from  "@sveltejs/kit"
import path from "path";

/** @type {import('./$types').RequestHandler} */

export async function GET ({ params, request}){
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }

    if(!params.slug){
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