import { imageRepo } from '$lib/imageRepository';
import { mainFileRepo, thumbFileRepo } from '$lib/fileService';
import { db } from '$lib/db';
import fs from "fs";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
    if (!locals.user) {
        console.log("no user");
        throw redirect(307, '/login');
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

        if( !locals.user){
            throw redirect(307, '/login');
        }
        let newSlug = "/posts";
        const data = await request.formData();
        const sName = data.get("sanitizedFilename");
        const thumbPath = data.get("thumbnailPath");
        const newRedirect = data.get("redirect"); 
        const adjacents = data.getAll("adjacents");
        if( adjacents.length > 0){
            newSlug = `/posts/?${adjacents[0]}`;
        }
        imageRepo.deleteByFileName(`${sName}`);
        mainFileRepo.deleteFile(`${sName}`);
        
        console.log(`deleted ${sName}`)

        throw redirect(303, newSlug);
    },

    update: async ({ request }) => {  // may not be using any more... TODO 
        const data = await request.json();
        const genName = data.genName;
        const tags = data.tags;
        console.log(genName);
        console.log(tags);
    }
}
