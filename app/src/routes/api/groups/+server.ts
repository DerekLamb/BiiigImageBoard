import { json, redirect, error } from '@sveltejs/kit'
import { groupController } from '$lib/server/controllers/groupController.js';

export async function POST({ request, locals }){
    if (!locals.user) {
        console.log("no user");
        throw redirect(307, '/login');
    }

    try {
        const body = await request.json().catch(() => {
            throw { code: 'INVALID JSON', message: 'Invalid JSON Message'}
        });

        // Check what type of operation we're performing
        if (body.groupId && body.imageId) {
            // Add single image to existing group
            await groupController.addImageToGroup(body.groupId, body.imageId);
            return json({ success: true, message: "Image added to existing group" });
        } else if (body.draggedImage && body.draggedOverImage) {
            // Create new group from two images (original drag and drop)
            const newGroup = await groupController.ensureGroup({
                name: Date.now().toString(),          
                children: [body.draggedImage, body.draggedOverImage], 
            });
            
            return json({ success: true, groupId: newGroup._id });
        } else if (body.imageIds && Array.isArray(body.imageIds) && body.imageIds.length > 0) {
            // Create new group with multiple images
            const name = body.name || Date.now().toString();
            const newGroup = await groupController.ensureGroup({
                name: name,
                children: body.imageIds,
            });
            
            return json({ success: true, groupId: newGroup._id });
        } else {
            throw { code: 'INVALID_REQUEST', message: 'Missing required parameters' };
        }
    } catch (e) {
        console.error(e);
        return json({ success: false, error: e });
    }
}

export async function GET({ locals }) { // returns all groups
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    try {
        const groups = await groupController.getAllGroups(); 
        return json({ success: true, groups: groups });
    } catch (err) {
        console.log(`Error fetching groups:`, err);

        throw error(500, {
            message: 'An unexpected error occurred while fetching the group'
        });
    }
}