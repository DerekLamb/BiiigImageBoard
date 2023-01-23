import db from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const images = await db.collection('testimages').find().toArray();
    
    const rawImages = images.map(({ name, fsName, genName, imagePath, tags}) => ({
        name,
        fsName,
        genName,
        imagePath,
        tags
    }))

    // console.log(rawImages)

    return{
        status: 200,
        images: rawImages
    }
}