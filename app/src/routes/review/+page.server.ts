import { redirect } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import { buildReviewFilter, REVIEW_PAGE_SIZE } from '$lib/server/reviewFilter';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		redirect(307, '/login');
	}

	const searchParams = url.searchParams;
	const startId = searchParams.get('start') || '';
	const searchTerm = searchParams.get('search') || '';
	const notag = searchParams.get('notag') || '';

	const filter = buildReviewFilter(searchTerm, notag);

	const totalImages = await ImageModel.countFilteredImages(filter);

	const page = 0;
	const images = await ImageModel.findImages(filter, REVIEW_PAGE_SIZE, 0, { uploadDate: -1 });

	let startIndex = 0;
	if (startId) {
		const idx = images.findIndex((img) => img.uploadDate === startId || img._id === startId);
		if (idx >= 0) startIndex = idx;
	}

	return {
		images,
		startIndex,
		searchTerm,
		notag,
		page,
		totalImages,
		pageSize: REVIEW_PAGE_SIZE
	};
};
