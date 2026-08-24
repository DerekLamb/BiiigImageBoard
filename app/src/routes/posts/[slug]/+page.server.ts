import imageController from "$lib/server/controllers/imageController";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }
    console.log( params.slug );
    console.log( typeof params.slug );
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

    // Calculated return page: /posts with this post's imageId, so the listing
    // load computes the exact page containing the *current* post (same rules
    // as the ?imageId= handling on the /posts page). Preserves the user's
    // grid size so the position within the default sort display holds, no
    // matter how the user navigated to this post (next/prev included).
    let returnLen = parseInt(url.searchParams.get('len') as string);
    if (isNaN(returnLen) || returnLen < 1 || returnLen > 100) {
        returnLen = 24;
    }

    return{
        status: 200,
        image: safeImage,
        adjacents: adjacents,
        returnPage: `/posts?imageId=${image._id}&len=${returnLen}`
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

    updatePrompt: async ({ request, locals }) => {
        if (!locals.user) {
            redirect(307, '/login');
        }

        const data = await request.json();
        const { imageId, embPrompt } = data;

        if (!imageId || !embPrompt) {
            throw new Error('Missing required fields');
        }

        try {
            await imageController.updateImageProperty(imageId, 'embPrompt', embPrompt);
            return { success: true };
        } catch (error: any) {
            console.error('Error updating embedded prompt:', error);
            throw new Error(error.message);
        }
    }
}
