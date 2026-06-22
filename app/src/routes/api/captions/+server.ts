import { json } from '@sveltejs/kit';
import imageController from '$lib/server/controllers/imageController';

export async function GET({ url, locals }: any) {
    if (!locals.user) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const imageId = url.searchParams.get('imageId');

    if (!imageId) {
        return json({ success: false, error: 'Missing imageId parameter' }, { status: 400 });
    }

    try {
        const image = await imageController.getImage(imageId);

        if (!image) {
            return json({ success: false, error: 'Image not found' }, { status: 404 });
        }

        return json({
            success: true,
            imageId: image._id,
            trainingPrompt: image.trainingPrompt || ''
        });
    } catch (error) {
        console.error('Error fetching training caption:', error);
        return json({ success: false, error: 'Failed to fetch caption' }, { status: 500 });
    }
}

export async function POST({ request, locals }: any) {
    if (!locals.user) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { imageId, trainingPrompt } = body;

        if (!imageId) {
            return json({ success: false, error: 'Missing imageId' }, { status: 400 });
        }

        // trainingPrompt can be empty string to clear it, so only validate presence
        const prompt = (trainingPrompt as string) ?? '';

        const result = await imageController.updateImageProperty(imageId, 'trainingPrompt', prompt);

        if (!result.success) {
            return json({ success: false, error: 'Failed to update caption' }, { status: 500 });
        }

        return json({
            success: true,
            imageId,
            trainingPrompt: prompt
        });
    } catch (error) {
        console.error('Error updating training caption:', error);
        return json({ success: false, error: 'Failed to update caption' }, { status: 500 });
    }
}
