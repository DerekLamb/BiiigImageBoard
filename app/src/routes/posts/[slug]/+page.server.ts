import imageController from "$lib/server/controllers/imageController";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const image = await imageController.getImageByTimestamp(params.slug);

    if(!image){
        return{
            status: 200,
            image: null,
        }
    }
    const adjacents = await imageController.getAdjacents("uploadDate", params.slug);

    return{
        status: 200,
        image: image,
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
            redirect(303, redirectSlug);
        }

        const deleted = await imageController.deleteImage(image);

        if(!deleted){
            throw new Error(`Error deleting image: ${image._id}`);
        }

        if( prev ){
            redirectSlug = `/posts/${prev}`;
        }
        else if( next ){
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
