import { json } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import { buildReviewFilter, REVIEW_PAGE_SIZE } from '$lib/server/reviewFilter';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const searchTerm = url.searchParams.get('search') || '';
	const notag = url.searchParams.get('notag') || '';
	const page = parseInt(url.searchParams.get('page') || '0', 10);

	const filter = buildReviewFilter(searchTerm, notag);

	const skip = page * REVIEW_PAGE_SIZE;
	const images = await ImageModel.findImages(filter, REVIEW_PAGE_SIZE, skip, { uploadDate: -1 });

	return json({ images, page });
};
