import { json } from '@sveltejs/kit'
import { GroupModel } from '$lib/server/models/groupModel';
import { TagModel } from '$lib/server/models/tagModel';

export async function POST({ request } : Request){
    try {
        const body = await request.json();
        console.log(body);

        GroupModel.createGroup({name: new Date().toISOString(), 
            uploadDate: new Date().toISOString(), 
            children: [body.draggedImage, body.draggedOverImage], 
            groups: [], 
            groupType: 'default', 
            groupTags: []});

        GroupModel.getGroupChildren(body.id, body.page, body.limit);
        // Insert image into group collection if first element is image 

        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}

export async function GET({ params }) {
    try {
        const {  } = params;
        const page = 0;
        const limit = 10;

        const children = await GroupModel.getGroupChildren(id, page, limit);
        console.log(children);
        return json({ success: true, children });
    } catch (e) {
        console.error(e);
        return json({ success: false });
    }
}