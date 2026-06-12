import { json, type RequestHandler } from '@sveltejs/kit';
import { cleanupService, type CleanupOperation } from '$lib/server/services/cleanupService';

/**
 * GET /api/comfy
 * Check ComfyUI connection status
 */
export const GET: RequestHandler = async () => {
    try {
        const connection = await cleanupService.checkConnection();
        return json({
            success: true,
            data: {
                connected: connection.connected,
                url: connection.url,
            },
        });
    } catch (error) {
        console.error('Error checking ComfyUI connection:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
};

/**
 * POST /api/comfy
 * Submit cleanup job(s)
 * Body: { imageIds: string[], operation: CleanupOperation }
 */
export const POST: RequestHandler = async ({ request, locals }: any) => {
    if (!locals.user) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { imageIds, operation } = body;

        // Validate input
        if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
            return json({
                success: false,
                error: 'imageIds must be a non-empty array',
            }, { status: 400 });
        }

        const validOperations: CleanupOperation[] = ['watermark_removal', 'upscale', 'img2img_cleanup', 'full_pipeline'];
        if (!operation || !validOperations.includes(operation)) {
            return json({
                success: false,
                error: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
            }, { status: 400 });
        }

        // Check ComfyUI connection first
        const connection = await cleanupService.checkConnection();
        if (!connection.connected) {
            return json({
                success: false,
                error: `ComfyUI is not reachable at ${connection.url}`,
            }, { status: 503 });
        }

        // Run cleanup
        const result = await cleanupService.batchCleanup(imageIds, operation);

        return json({
            success: true,
            data: {
                total: result.total,
                successful: result.successful,
                failed: result.failed,
                results: result.results.map(r => ({
                    originalImageId: r.originalImageId,
                    resultImageId: r.resultImageId,
                    success: r.success,
                    error: r.error,
                })),
            },
        });
    } catch (error) {
        console.error('Error in cleanup endpoint:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
};
