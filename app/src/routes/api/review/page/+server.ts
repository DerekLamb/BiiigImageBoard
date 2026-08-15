import { json } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 200;

export const GET: RequestHandler = async ({ url, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchTerm = url.searchParams.get('search') || '';
    const notag = url.searchParams.get('notag') || '';
    const page = parseInt(url.searchParams.get('page') || '0', 10);

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

    const skip = page * PAGE_SIZE;
    const images = await ImageModel.findImages(filter, PAGE_SIZE, skip, { uploadDate: -1 });

    return json({ images, page });
};
