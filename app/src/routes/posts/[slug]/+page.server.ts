import { imageRepo } from '$lib/imageRepository';
import { mainFileRepo, thumbFileRepo } from '$lib/fileService';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const adjacents = await imageRepo.getAdjacentTimestamps(params.slug);
    const image = await imageRepo.getByTimestamp(params.slug);
    delete image?._id;
    
    if(!image){
        return{
            status: 200,
            image: null,
        }
    }

    return{
        status: 200,
        image: image,
        adjacents: adjacents
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    delete: async ({ request, locals }) => {
        console.log("delete action reached");
        if( !locals.user){
            redirect(307, '/login');
        }

        const data = await request.formData();
        const sName = data.get("sanitizedFilename");
        const thumbPath = data.get("thumbnailPath");
        const adjacents = data.getAll("adjacents");
        const next = data.get("next");
        const prev = data.get("prev");
        let redirectSlug = "/posts";
        
        if( next ){
            redirectSlug = `/posts/${next}`;
        }
        else if( prev ){
            redirectSlug = `/posts/${prev}`;
        }
        
        imageRepo.deleteByFileName(`${sName}`);
        mainFileRepo.deleteFile(`${sName}`);
        thumbFileRepo.deleteFile(`${thumbPath}`);

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
