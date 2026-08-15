import { redirect } from '@sveltejs/kit';
import { uploadEventController } from '$lib/server/controllers/uploadEventController';
import { ImageModel } from '$lib/server/models/imageModel';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, url, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const { slug } = params;
    const thresholdMinutes = parseInt(url.searchParams.get('threshold') as string) || 480;
    const thresholdMs = thresholdMinutes * 60 * 1000;

    const event = await uploadEventController.getEventByStartDate(slug, thresholdMs);

    if (!event) {
        return {
            status: 404,
            event: null,
            images: [],
            pagination: { total: 0, pageCount: 1, currentPage: 1, itemsPerPage: 24 }
        };
    }

    const pageNum = parseInt(url.searchParams.get('page') as string) || 1;
    let lengthNum = parseInt(url.searchParams.get('len') as string);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 100) {
        lengthNum = 24;
    }
    const currPage = Math.max(pageNum, 1);

    const imageId = url.searchParams.get('imageId') as string;

    const query = {
        uploadDate: {
            $gte: event.startDate,
            $lte: event.endDate
        }
    };

    let skip = (currPage - 1) * lengthNum;

    if (imageId) {
        const image = await ImageModel.getImageById(imageId);
        if (image) {
            const docsBeforeImage = await ImageModel.countFilteredImages({
                ...query,
                uploadDate: { $gt: image.uploadDate }
            });
            const calculatedPage = Math.floor(docsBeforeImage / lengthNum) + 1;
            skip = (calculatedPage - 1) * lengthNum;
        }
    }

    const images = await ImageModel.findImages(query, lengthNum, skip);
    const totalCount = await ImageModel.countFilteredImages(query);
    const numPages = Math.ceil(totalCount / lengthNum);

    return {
        status: 200,
        event: event,
        images: images,
        pagination: {
            total: totalCount,
            pageCount: numPages,
            currentPage: currPage,
            itemsPerPage: lengthNum
        },
        thresholdMinutes: thresholdMinutes
    };
}) satisfies PageServerLoad;
