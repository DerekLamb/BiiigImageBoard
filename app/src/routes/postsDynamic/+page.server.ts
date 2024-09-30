import { redirect } from '@sveltejs/kit';
import imageController from '$lib/server/controllers/imageController';
import { aggController } from '$lib/server/controllers/aggController';

import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals}) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const { searchParams } = url;
    const pageNum : number = parseInt(searchParams.get('page') as string) || 1;
    const searchTerm : string = searchParams.get('search') as string || '';
    const currPage = Math.max(pageNum, 1);

    let lengthNum = parseInt(searchParams.get('len') as string);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 100) {
        lengthNum = 24; 
    }
    
    //const images = await imageController.getImagePage({page: currPage, length: lengthNum, search: searchTerm})
    const documents = await aggController.getAggregateData({page: currPage, length: lengthNum})
    console.log(currPage, lengthNum, documents);
    const pageLength = lengthNum || 24;

    const numPages = Math.ceil(await imageController.getImageCount() / pageLength);

    return{
        status: 200,
        documents: documents,
        pageNum: numPages,
        currPage: currPage,
        len: lengthNum,
        searchTerm: searchTerm
    }
}) satisfies PageServerLoad;