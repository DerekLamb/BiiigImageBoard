import { json } from '@sveltejs/kit'
import { groupController } from '$lib/server/controllers/groupController.js';

export async function POST({ request } : Request){
    // user access check here TODO
    try {
        const body = await request.json();
        console.log(body);

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

export async function GET({ params }) {
    // user access check TODO
    // returns children of group specified or top level groups if no group specified
    try {
        const groupId = params;
        const page = 1;
        const length = 10;

        const children = await groupController.getGroupPage({page, length,})
        console.log(children);
        return json({ success: true, children });
    } catch (e) {
        console.error(e);
        return json({ success: false });
    }
}