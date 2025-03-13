import { redirect } from '@sveltejs/kit';
import imageController from '$lib/server/controllers/imageController';
import { ImageModel } from '$lib/server/models/imageModel';

import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const { searchParams } = url;
    const imageId: string = searchParams.get('imageId') as string;
    let pageNum: number = parseInt(searchParams.get('page') as string) || 1;
    const searchTerm: string = searchParams.get('search') as string || '';
    const notag: string = searchParams.get('notag') as string || '';
    const currPage = Math.max(pageNum, 1);


    let lengthNum = parseInt(searchParams.get('len') as string);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 100) {
        lengthNum = 24; 
    }
    

    let filter: any = {};
    if (searchTerm.length > 0) {
        filter.tags = { $all: [searchTerm] };
    }
    if (notag.length > 0) {
        
        if (filter.tags) {
            
            filter.tags = {
                $all: [searchTerm],
                $not: { $in: [notag] }
            };
        } else {
            filter.tags = { $not: { $in: [notag] } };
        }
    }

    let skip = (currPage - 1) * lengthNum;


    if (imageId) {
        const image = await ImageModel.getImageById(imageId);
        console.log(image);
        if (image) {
            let docsBeforeImage = 0;

            if (Object.keys(filter).length > 0) {
                docsBeforeImage = await countDocumentsBeforeDate(filter, image.uploadDate);
            } else {
                docsBeforeImage = await countDocumentsBeforeDate({}, image.uploadDate);
            }

            pageNum = Math.floor(docsBeforeImage / lengthNum) + 1;
            skip = (pageNum - 1) * lengthNum;
            console.log("hi");
            redirect(307, '/login');
        }
    }

    const images = await ImageModel.findImages(filter, lengthNum, skip);
    
    const totalCount = await imageController.getImageCount();
    const numPages = Math.ceil(totalCount / lengthNum);

    

    return {
        status: 200,
        images: images,
        pagination: {
            total: totalCount,
            pageCount: numPages,
            currentPage: pageNum,
            itemsPerPage: lengthNum
        },
        searchTerm: searchTerm,
        notag: notag
    }
}) satisfies PageServerLoad;


//need to improve this later... Possibly add it to a model
async function countDocumentsBeforeDate(filter: any, uploadDate: string): Promise<number> {
    const countFilter = { ...filter, uploadDate: { $gt: uploadDate } };
    
    const count = await ImageModel.countFilteredImages(countFilter);
    return count;
}