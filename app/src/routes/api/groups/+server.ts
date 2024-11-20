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

        groupController.ensureGroup({name: Date.now().toString(), 
            uploadDate: Date.now().toString(), 
            children: [body.draggedImage, body.draggedOverImage], 
            group: [], 
            groupType: 'default', 
            groupTags: []})  
        
        // GroupModel.getGroupChildren(body.id, body.page, body.limit);
        // Insert image into group collection if first element is image 

        return json({ success: true });
    } catch (e) {
        console.error(e);
        return json({ success: false });
    }
}

export async function GET({ locals }) { // returns all groups
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    try {
        const groups = groupController.getAllGroups(); 
        return json({ success: true, groups: groups });
    } catch (err) {
        console.log(`Error fetching groups:`, err);

        throw error(500, {
            message: 'An unexpected error occurred while fetching the group'
        });
    }
}