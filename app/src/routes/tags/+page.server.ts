import { TagModel } from '$lib/server/models/tagModel';

export const load = async () => {
	let tags: string[] = [];
	try {
		tags = await TagModel.getAll();
	} catch (e) {
		console.error(e);
	}
	return { tags };
};
