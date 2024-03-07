import { page } from '$app/stores';
import db from '$lib/db';
import { imageRepo } from '$lib/imageRepository';


import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
    const { searchParams } = url;
    const pageNum : number = parseInt(searchParams.get('page') as string) || 1;
    const searchTerm : string = searchParams.get('search') as string || '';
    const currPage = Math.max(pageNum, 1);

    let lengthNum = parseInt(searchParams.get('len') as string);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 100) {
        lengthNum = 24; 
    }

    const images = await imageRepo.getPage(currPage, lengthNum, [searchTerm]);

    const pageLength = lengthNum || 24;

    const numPages = Math.ceil(await db.collection('testimages').estimatedDocumentCount() / pageLength);
    images.forEach( image => {
        delete image._id;
    });

    return{
        status: 200,
        images: images,
        pageNum: numPages,
        currPage: currPage,
        len: lengthNum,
        searchTerm: searchTerm
    }
}) satisfies PageServerLoad;