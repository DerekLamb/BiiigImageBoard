import { json } from '@sveltejs/kit'
import { GroupModel } from "$lib/server/models/groupModel"

export async function POST({ request } : Request){
    // user access check here TODO
    try {
        const body = await request.json();
        console.log(body);

        GroupModel.createGroup({name: Date.now().toString(), 
            uploadDate: Date.now().toString(), 
            children: [body.draggedImage, body.draggedOverImage], 
            groups: [], 
            groupType: 'default', 
            groupTags: []});
        
        
        // GroupModel.getGroupChildren(body.id, body.page, body.limit);
        // Insert image into group collection if first element is image 

        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}