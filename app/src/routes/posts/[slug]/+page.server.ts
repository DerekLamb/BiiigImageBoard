import db from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    params.slug
    const image = await db.collection('testimages').findOne({genName:params.slug});
    delete image._id;

    console.log(image);
    console.log(params.slug);


    // console.log(rawImages)

    return{
        status: 200,
        image: image
    }
}