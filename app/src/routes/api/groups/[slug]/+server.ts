import { groupController } from '$lib/server/controllers/groupController.js';
import  imageController  from '$lib/server/controllers/imageController.js'
import { json, redirect, error } from '@sveltejs/kit';

/**
 * GET /api/groups/[slug] - Retrieve a specific group by ID
 */
export async function GET({ params, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    if (!params.slug) {
        throw error(400, {
            message: 'Group ID is required'
        });
    }

    try {
        const group = await groupController.getGroup(params.slug);

        if (!group) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        return json({
            data: group
        });
    } catch (err) {
        console.error(`Error fetching group ${params.slug}:`, err);
        
        if (err.status) {
            throw err; // Rethrow if it's already a proper error response
        }

        throw error(500, {
            message: 'An unexpected error occurred while fetching the group'
        });
    }
}

/**
 * PUT /api/groups/[slug] - Update an existing group
 */
export async function PUT({ params, request, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    if (!params.slug) {
        throw error(400, {
            message: 'Group ID is required'
        });
    }

    try {
        const body = await request.json().catch(() => {
            throw error(400, { message: 'Invalid JSON payload' });
        });

        // Verify group exists
        const existingGroup = await groupController.getGroup(params.slug);
        if (!existingGroup) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        // Update the group
        const updatedGroup = await groupController.updateGroup(params.slug, {
            name: body.name,
            groupType: body.groupType,
            groupTags: body.groupTags,
            // Don't update children directly here - use dedicated endpoints for managing group members
        });

        return json({
            data: updatedGroup,
            message: 'Group updated successfully'
        });
    } catch (err) {
        console.error(`Error updating group ${params.slug}:`, err);
        
        if (err.status) {
            throw err; // Rethrow if it's already a proper error response
        }

        throw error(500, {
            message: 'An unexpected error occurred while updating the group'
        });
    }
}

/**
 * PATCH /api/groups/[slug] - Partially update a group or modify its members
 */
export async function PATCH({ params, request, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    if (!params.slug) {
        throw error(400, {
            message: 'Group ID is required'
        });
    }

    try {
        const body = await request.json().catch(() => {
            throw error(400, { message: 'Invalid JSON payload' });
        });

        // Verify group exists
        const existingGroup = await groupController.getGroup(params.slug);
        if (!existingGroup) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        let result;

        // Handle different types of PATCH operations
        if (body.operation === 'add-images') {
            // Add images to group
            if (!body.imageIds || !Array.isArray(body.imageIds) || body.imageIds.length === 0) {
                throw error(400, { message: 'imageIds must be a non-empty array' });
            }
            
            for (const imageId of body.imageIds) {
                if(await imageController.addImageToGroup(imageId, params.slug)){
                    await groupController.addImageToGroup(params.slug, imageId);
                }
                else{
                    throw error(400, { message: "imageId does not exist"})
                }
            }
            
            result = await groupController.getGroup(params.slug);
            return json({
                data: result,
                message: `Added ${body.imageIds.length} image(s) to group`
            });
        } 
        else if (body.operation === 'remove-images') {
            // Remove images from group - would need to implement this method in controller
            throw error(501, { message: 'Image removal not yet implemented' });
        }
        else {
            // Regular partial update (just the metadata, not members)
            const updateData = {};
            
            if (body.name !== undefined) updateData.name = body.name;
            if (body.groupType !== undefined) updateData.groupType = body.groupType;
            if (body.groupTags !== undefined) updateData.groupTags = body.groupTags;
            
            result = await groupController.updateGroup(params.slug, updateData);
            return json({
                data: result,
                message: 'Group updated successfully'
            });
        }
    } catch (err) {
        console.error(`Error updating group ${params.slug}:`, err);
        
        if (err.status) {
            throw err; // Rethrow if it's already a proper error response
        }

        throw error(500, {
            message: 'An unexpected error occurred while updating the group'
        });
    }
}

/**
 * DELETE /api/groups/[slug] - Delete a group
 */
export async function DELETE({ params, locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    if (!params.slug) {
        throw error(400, {
            message: 'Group ID is required'
        });
    }

    try {
        // Verify group exists
        const existingGroup = await groupController.getGroup(params.slug);
        if (!existingGroup) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        // Need to implement delete method in controller
        // await groupController.deleteGroup(params.slug);

        // Since delete method doesn't exist yet
        throw error(501, { 
            message: 'Group deletion not yet implemented' 
        });

        // When implemented, uncomment:
        // return json({
        //     message: 'Group deleted successfully'
        // });
    } catch (err) {
        console.error(`Error deleting group ${params.slug}:`, err);
        
        if (err.status) {
            throw err; // Rethrow if it's already a proper error response
        }

        throw error(500, {
            message: 'An unexpected error occurred while deleting the group'
        });
    }
}