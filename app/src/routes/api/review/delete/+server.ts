import { json, error } from '@sveltejs/kit';
import imageController from '$lib/server/controllers/imageController';
import { ImageModel } from '$lib/server/models/imageModel';

export async function POST({ request, locals }: { request: Request; locals: { user: any } }) {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const body = await request.json();
        const { imageId } = body;

        if (!imageId) {
            return json({ success: false, error: 'Missing imageId' }, { status: 400 });
        }

        const image = await ImageModel.getImageById(imageId);
        if (!image) {
            return json({ success: false, error: 'Image not found' }, { status: 404 });
        }

        const result = await imageController.deleteImage(image);
        return json(result);
    } catch (e: any) {
        console.error('Review delete error:', e);
        return json({ success: false, error: e.message || 'Delete failed' }, { status: 500 });
    }
}
