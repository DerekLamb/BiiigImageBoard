import { json } from '@sveltejs/kit'
import { GroupModel } from '$lib/server/models/groupModel';
import { TagModel } from '$lib/server/models/tagModel';

export async function POST({ request } : Request){
    try {
        const body = await request.json();
        console.log(body);
        // Insert image into group collection if first element is image 

        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}