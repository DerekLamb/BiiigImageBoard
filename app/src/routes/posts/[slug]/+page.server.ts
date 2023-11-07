import db from '$lib/db';
import fs from "fs";
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
    params.slug
    const image = await db.collection('testimages').findOne({genName:params.slug});
    if(!image){
        return{
            status: 200,
            image: null,
        }
    }
    delete image._id;

    return{
        status: 200,
        image: image,
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    delete: async ({ request }) => {
        const data = await request.formData();
        const gName = data.get("imageName");
        const fName = data.get("fileName");
        const newRedirect = data.get("redirect"); // not used yet
        console.log(gName);
        console.log(fName);
        if(gName){
        db.collection('testimages').deleteOne({genName:gName} )
        }
        fs.unlink(`${fName}`, (err) => {
            console.log(`${fName}`)
            if(err) throw err;
            console.log(`deleted ${fName}`)
        });
        
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
