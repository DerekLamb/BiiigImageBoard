import { redirect } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import imageController from '$lib/server/controllers/imageController';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
    if (!locals.user) {
        redirect(307, '/login');
    }

    const searchParams = url.searchParams;
    const startId = searchParams.get('start') || '';
    const searchTerm = searchParams.get('search') || '';
    const notag = searchParams.get('notag') || '';

    let filter: any = {};
    if (searchTerm) {
        filter.tags = { $all: [searchTerm] };
    }
    if (notag) {
        if (filter.tags) {
            filter.tags = {
                $all: [searchTerm],
                $not: { $in: [notag] }
            };
        } else {
            filter.tags = { $not: { $in: [notag] } };
        }
    }

    const allImages = await ImageModel.findImages(filter, 0, 0, { uploadDate: -1 });

    let startIndex = 0;
    if (startId) {
        const idx = allImages.findIndex(img => img.uploadDate === startId || img._id === startId);
        if (idx >= 0) startIndex = idx;
    }

    return {
        images: allImages,
        startIndex,
        searchTerm,
        notag
    };
};

export const actions = {
    delete: async ({ request, locals }) => {
        if (!locals.user) {
            redirect(307, '/login');
        }

        const data = await request.formData();
        const imageId = data.get('imageId') as string;

        if (!imageId) {
            return { success: false, error: 'Missing imageId' };
        }

        const image = await imageController.getImage(imageId);
        if (!image) {
            return { success: false, error: 'Image not found' };
        }

        return await imageController.deleteImage(image);
    }
};
