/**
 * Image Processing API Endpoint
 * Provides endpoints to trigger and monitor batch image processing
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { imageProcessor } from '$lib/server/services/taskQueue/imageProcessor';

/**
 * GET /api/process
 * Get current processing statistics and status
 */
export const GET: RequestHandler = async () => {
    try {
        const stats = imageProcessor.getStats();
        const isActive = imageProcessor.isActive();
        
        return json({
            success: true,
            data: {
                isProcessing: isActive,
                stats
            }
        });
    } catch (error) {
        console.error('Error getting processing stats:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};

/**
 * POST /api/process
 * Trigger batch processing of images
 * Body: { action: 'start' | 'status', limit?: number }
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { action, limit = 100 } = body;

        if (action === 'start') {
            // Check if already processing
            if (imageProcessor.isActive()) {
                return json({
                    success: false,
                    error: 'Processing already in progress'
                }, { status: 409 });
            }

            // Start processing asynchronously (don't await)
            imageProcessor.processAllImages((stats) => {
                console.log('Processing progress:', stats);
            }).then((result) => {
                console.log('Processing complete:', result);
            }).catch((error) => {
                console.error('Processing error:', error);
            });

            return json({
                success: true,
                message: 'Processing started',
                data: { limit }
            });
        }

        if (action === 'status') {
            const stats = imageProcessor.getStats();
            const isActive = imageProcessor.isActive();
            
            return json({
                success: true,
                data: {
                    isProcessing: isActive,
                    stats
                }
            });
        }

        return json({
            success: false,
            error: 'Invalid action. Use "start" or "status"'
        }, { status: 400 });

    } catch (error) {
        console.error('Error in processing endpoint:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
