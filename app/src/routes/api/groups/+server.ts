import { json, redirect, error } from '@sveltejs/kit';
import { groupController } from '$lib/server/controllers/groupController.js';
import { GroupModel } from '$lib/server/models/groupModel.js';

/**
 * GET /api/groups - Retrieve all groups
 */
export async function GET({ url, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    try {
        // Support pagination and filtering
        const { searchParams } = url;
        const pageNum = parseInt(searchParams.get('page') as string) || 1;
        const limit = parseInt(searchParams.get('limit') as string) || 50;
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || '';
        const currPage = Math.max(pageNum, 1)

        const skip = (currPage -1) * limit;
        const groups = await GroupModel.findGroups({})

        const count = await groupController.getGroupCount();

        return json({
            groups: groups,
            meta: {
                total: count,
                currPage,
                limit,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching groups:', err);
        throw error(500, {
            message: 'An unexpected error occurred while fetching groups'
        });
    }
}

/**
 * POST /api/groups - Create a new group
 */
export async function POST({ request, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    try {
        const body = await request.json().catch(() => {
            throw error(400, { message: 'Invalid JSON payload' });
        });

        // Required field validation
        if (!body.name) {
            body.name = Date.now().toString(); // Default name if not provided
        }

        // Validate imageIds if provided
        if (body.imageIds && (!Array.isArray(body.imageIds) || body.imageIds.length === 0)) {
            throw error(400, { message: 'imageIds must be a non-empty array' });
        }

        const groupData = {
            name: body.name,
            children: body.imageIds || [],
            groupType: body.groupType || 'default',
            groupTags: body.groupTags || []
        };

        const newGroup = await groupController.createGroup(groupData);

        return json({
            data: newGroup,
            message: 'Group created successfully'
        }, { status: 201 });
    } catch (err) {
        console.error('Error creating group:', err);
        
        if (err.status) {
            throw err; // Rethrow if it's already a proper error response
        }
        
        throw error(500, {
            message: 'An unexpected error occurred while creating the group'
        });
    }
}