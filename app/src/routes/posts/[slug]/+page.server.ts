import { fileService, imageRepo, sanitizeImage } from '$lib/imageService';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const adjacents = await imageRepo.getAdjacentTimestamps(params.slug);
    const image = await imageRepo.getOne("uploadDate", params.slug);
    if(!image){
        return{
            status: 200,
            image: null,
        }
    }
    const sanitized = sanitizeImage(image);

    return{
        status: 200,
        image: sanitized,
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
        const strId = data.get("strId");
        const next = data.get("next");
        const prev = data.get("prev");
        let redirectSlug = "/posts";
        
        const image = await imageRepo.getOne("_id",strId);
        if(!image){
            throw new Error(`Image not found: ${strId}`);
            redirect(303, redirectSlug);
        }

        if( prev ){
            redirectSlug = `/posts/${prev}`;
        }
        else if( next ){
            redirectSlug = `/posts/${next}`;
        }
        
        try{
            imageRepo.deleteOne("_id", strId);
            fileService.deleteImage(image)
            fileService.deleteThumbnail(image);
        }
        catch(error)
        {
            console.log(`Error deleting image: ${strId}`);
        }

        redirect(303, redirectSlug);
    },

    update: async ({ request }) => {  // may not be using any more... TODO 
        const data = await request.json();
        const genName = data.genName;
        const tags = data.tags;
        console.log(genName);
        console.log(tags);
    }
}
