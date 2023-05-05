import { page } from '$app/stores';
import db from '$lib/db';




import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
    const { searchParams } = url;
    const pageNum = parseInt(searchParams.get('page') || '1');
    const currPage = Math.max(pageNum, 1);
    const lengthNum = parseInt(searchParams.get('len') || '30');
    console.log(currPage);
    const pageLength = lengthNum || 30;
    const startInd = (currPage - 1) * pageLength;

    const images = await db.collection('testimages')
        .find()
        .sort({ genName:-1 })
        .skip(startInd)
        .limit(pageLength)
        .toArray();

    const numPages = Math.ceil(await db.collection('testimages').countDocuments() / pageLength);
    
    const rawImages = images.map(({ name, fsName, genName, imagePath, tags}) => ({
        name,
        fsName,
        genName,
        imagePath,
        tags
    }))


    return{
        status: 200,
        images: rawImages,
        pageNum: numPages,
        currPage: currPage,
        lengthNum: lengthNum
    }
}) satisfies PageServerLoad;


