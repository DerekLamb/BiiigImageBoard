import { redirect } from '@sveltejs/kit';
import { uploadEventController } from '$lib/server/controllers/uploadEventController';
import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const { searchParams } = url;
    const thresholdMinutes = parseInt(searchParams.get('threshold') as string) || 480;
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const scanLimit = parseInt(searchParams.get('limit') as string) || 10000;
    const skip = parseInt(searchParams.get('skip') as string) || 0;

    const result = await uploadEventController.getUploadEvents({
        thresholdMs,
        scanLimit,
        skip
    });

    return {
        status: 200,
        events: result.events,
        totalEvents: result.totalEvents,
        totalImagesScanned: result.totalImagesScanned,
        thresholdMinutes: thresholdMinutes,
        scanLimit: scanLimit,
        skip: skip
    };
}) satisfies PageServerLoad;
