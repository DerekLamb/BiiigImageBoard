import { json, redirect } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import type { RequestHandler } from './$types';


/**
 * GET /api/pages - Get page based on params such as limit, skip, searchable tags, and imageId
 */
export const GET: RequestHandler = async ({ url, locals }) => {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    try {
        // parameters 
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        let skip = parseInt(url.searchParams.get('skip') || '0', 10);
        const tags = url.searchParams.getAll('tags');
        const notag = url.searchParams.getAll('notag');
        const imageId = url.searchParams.get('imageId');
        
        //building basic filter for mongoDB
        let filter: any = {};
        if (tags.length > 0) {
            filter.tags = { $all: tags };
        }
        if (notag.length > 0) {
            filter.tags = { $not: { $in: notag } };
        }

        // skip set by imageId position if contained 
        if (imageId) {
            const image = await ImageModel.getImageById(imageId);
            if (image) {
                let count = 0;
                if (tags.length > 0 || notag.length > 0) {
                    // counting documents in search
                    count = await countDocumentsBeforeUploadDate(filter, image.uploadDate);
                } else {
                    // Otherwise use the simpler query
                    const countFilter = { uploadDate: { $gt: image.uploadDate } };
                    const docs = await ImageModel.findImages(countFilter, 1000000, 0);
                    count = docs.length;

                    //TODO possibly improve this? Maybe write a queryBased ImageModel function that utilizes .count() 
                }
                
                skip = Math.floor(count / limit) * limit;
            }
        }

        // Get the images for the requested page
        const images = await ImageModel.findImages(filter, limit, skip);
        
        // Get total count for pagination
        const totalImages = await ImageModel.countImages();
        const totalPages = Math.ceil(totalImages / limit);

        return json({
            success: true,
            images,
            pagination: {
                total: totalImages,
                totalPages,
                currentPage: Math.floor(skip / limit) + 1,
                limit,
                skip
            }
        });
    } catch (error) {
        console.error('Error in page API:', error);
        return json({ success: false, error: 'Failed to fetch page data' }, { status: 500 });
    }
};

// TODO move to model at some point.
async function countDocumentsBeforeUploadDate(filter: any, uploadDate: string): Promise<number> {
    const countFilter = { ...filter, uploadDate: { $gt: uploadDate } };
    const docs = await ImageModel.findImages(countFilter, 1000000, 0);
    return docs.length;
}