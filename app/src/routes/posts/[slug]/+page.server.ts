import { imageRepo } from '$lib/imageRepository';
import { mainFileRepo, thumbFileRepo } from '$lib/fileService';
import { db } from '$lib/db';
import fs from "fs";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
    params.slug
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
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    delete: async ({ request }) => {
        const data = await request.formData();
        const oName = data.get("originalName");
        const sName = data.get("sanitizedFilename");
        const thumbPath = data.get("thumbnailPath");
        const newRedirect = data.get("redirect"); // not used yet but is this the best way? Might do a store...       
        imageRepo.deleteByFileName(`${sName}`);
        mainFileRepo.deleteFile(`${sName}`);
        
        console.log(`deleted ${sName}`)

        throw redirect(303,"/posts");
    },

    update: async ({ request }) => {  // may not be using any more... TODO 
        const data = await request.json();
        const genName = data.genName;
        const tags = data.tags;
        console.log(genName);
        console.log(tags);
    }
}
