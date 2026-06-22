import { type RequestHandler } from '@sveltejs/kit';
import { exportService } from '$lib/server/services/exportService';

/**
 * POST /api/export
 * Export selected images or a group as a zip archive with caption files.
 * 
 * Body: {
 *   imageIds?: string[],      // Array of image IDs to export
 *   groupId?: string,         // Group ID to export (alternative to imageIds)
 *   includeWithoutCaptions?: boolean  // Include images without captions (default: false)
 * }
 */
export const POST: RequestHandler = async ({ request, locals }: any) => {
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await request.json();
        const { imageIds, groupId, includeWithoutCaptions = false } = body;

        // Validate input
        if (!imageIds && !groupId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Either imageIds or groupId is required',
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Generate zip
        let result;
        if (groupId) {
            result = await exportService.exportGroup(groupId, includeWithoutCaptions);
        } else {
            if (!Array.isArray(imageIds) || imageIds.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'imageIds must be a non-empty array',
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            result = await exportService.exportSelected(imageIds, includeWithoutCaptions);
        }

        // Return zip file as download
        return new Response(result.buffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'Content-Length': String(result.buffer.length),
                'X-Export-Item-Count': String(result.itemCount),
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during export',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
