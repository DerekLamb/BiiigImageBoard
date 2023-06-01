import { page } from '$app/stores';
import db from '$lib/db';


import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
    const { searchParams } = url;
    const pageNum = parseInt(searchParams.get('page') || '1');
    const currPage = Math.max(pageNum, 1);
    const lengthNum = parseInt(searchParams.get('len') || '50');

    // Extract the 'tag' query parameter as an array
    const tags = searchParams.getAll('tag');

    // Extract the 'notag' query parameter as an array
    const notag = searchParams.getAll('notag');

    const pageLength = lengthNum || 30;
    const startInd = (currPage - 1) * pageLength;

    interface Filter {
        $and?:{ 
            tags?: {$all: string[]},
            tags?: {$nin: string[]}}
      }

        // Create a filter object to pass to the MongoDB 'find' method
        let filter:Filter = {};
        if (tags.length > 0) {
            filter.tags = { $all: tags };
        }
        if (notag) {
            filter.tags = { $not: { $in: [notag] } };
        }

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


    return{
        status: 200,
        images: rawImages,
        pageNum: numPages,
        currPage: currPage,
        lengthNum: lengthNum
    }
}) satisfies PageServerLoad;