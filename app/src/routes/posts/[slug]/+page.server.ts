import imageController from "$lib/server/controllers/imageController";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from "$lib/auth"

export const load: PageServerLoad = async ({ params, request }) => {
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }

    const image = await imageController.getImageByTimestamp(params.slug);
    
    const safeImage = {
        group: [],
        tags: [],
        ...image
    }
    
    if(!image){
        return{
            status: 404,
            image: null,
        }
    }
    const adjacents = await imageController.getAdjacents("uploadDate", params.slug);

    return{
        status: 200,
        image: safeImage,
        adjacents: adjacents
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    delete: async ({ request, locals }) => {
        if( !locals.user){
            redirect(307, '/login');
        }

        const data = await request.formData();
        const strId = data.get("strId") as string;
        const next = data.get("next") as string;
        const prev = data.get("prev") as string;
        let redirectSlug = "/posts";
        console.log(strId);
        const image = await imageController.getImage(strId);
 
        if(!image){
            throw new Error(`Image not found: ${strId}`);
        }

        const deleted = await imageController.deleteImage(image); //needs tweaking

        // if(!deleted){
            console.log(deleted);
        //     throw new Error(`Error deleting image: ${image._id}`);
        // }

        if( prev != "" ){
            console.log(prev);
            redirectSlug = `/posts/${prev}`;
        }
        else if( next != "" ){
            redirectSlug = `/posts/${next}`;
        }


        redirect(303, redirectSlug);
    },

    update: async ({ request, locals }) => {  // may not be using any more... TODO 
        if( !locals.user){
            redirect(307, '/login');
        }

        const data = await request.json();
        const genName = data.genName;
        const tags = data.tags;
        console.log(genName);
        console.log(tags);
    }
}
