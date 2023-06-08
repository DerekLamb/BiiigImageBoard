import { page } from '$app/stores';
import db from '$lib/db';
import txtToSearchParam from '$lib/SearchTxtToFilter';


import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
    const { searchParams } = url;
    const pageNum = parseInt(searchParams.get('page') || '1');
    const currPage = Math.max(pageNum, 1);
    const lengthNum = parseInt(searchParams.get('len') || '24');

    // Extract the 'search' query parameter as an array
    const tags = searchParams.getAll('search');
    const filter = tags ? txtToSearchParam(tags[0]) : {};


    const pageLength = lengthNum || 20;
    const startInd = (currPage - 1) * pageLength;

    const images = await db.collection('testimages')
        .find(filter)
        .sort({ genName:-1 })
        .skip(startInd)
        .limit(pageLength)
        .toArray();

    const numPages = Math.ceil(await db.collection('testimages').estimatedDocumentCount() / pageLength);
    
    const rawImages = images.map(({ name, fsName, genName, imagePath, tags}) => ({
        name,
        fsName,
        genName,
        imagePath,
        tags
    }))

    console.log(rawImages);

    return{
        status: 200,
        images: rawImages,
        pageNum: numPages,
        currPage: currPage,
        lengthNum: lengthNum,
    }
}) satisfies PageServerLoad;