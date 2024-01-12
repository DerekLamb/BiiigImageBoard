import { imageRepo } from '$lib/imageRepository';
import { mainFileRepo } from '$lib/fileService';
import db from '$lib/db';
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
        const fName = data.get("fileName"); //includes dir
        
        if(typeof fName == 'string') {
            imageRepo.deleteFilename(fName)
            mainFileRepo.deleteFile(fName)
        }
        // fs.unlink(`${fName}`, (err) => {
        //     console.log(`${fName}`)
        //     if(err) throw err;
        //     console.log(`deleted ${fName}`)
        // });
        
        throw redirect(303,"/posts");
    },

    update: async ({ request }) => {
        const data = await request.json();
        const genName = data.genName;
        const tags = data.tags;
        console.log(genName);
        console.log(tags);
    }
}
