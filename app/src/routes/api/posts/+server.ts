import { json, error } from '@sveltejs/kit'
import { BatchService } from "$lib/server/services/batchService"
import type { BatchOperationRequest } from "$lib/server/services/batchService"

export async function POST ({ request, locals }: { request: Request; locals: { user: any } }) {
    if (!locals.user) {
        throw error(401, 'Unauthorized')
    }

    try {
        const body = await request.json() as BatchOperationRequest;
        console.log('Batch operation request:', body);

        const batchService = new BatchService();
        const result = await batchService.handleBatchOperation(body);

        if (result.success) {
            return json({
                success: true,
                message: result.message,
                groupId: (result as any).groupId
            });
        }
        
        return json({
            success: false,
            message: result.message
        }, { status: 500 });
        
    } catch (e: any) {
        console.error('Batch operation error:', e);
        
        if (e.status) {
            throw error(e.status, e.message);
        }
        
        return json({
            success: false,
            message: 'An unexpected error occurred'
        }, { status: 500 });
    }
}