import { json } from '@sveltejs/kit'
import imageController from '$lib/server/controllers/imageController';

export async function POST({ request, locals }: any) {
    if (!locals.user) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { imageId, embPrompt } = data;

    if (!imageId || !embPrompt) {
        return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const result = await imageController.updateImageProperty(imageId, 'embPrompt', embPrompt);

        if (!result.success) {
            return json({ success: false, error: 'Failed to update image' }, { status: 500 });
        }

        return json({ success: true, updatedImage: result.updatedImage });
    } catch (error: any) {
        console.error('Error updating embedded prompt:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}