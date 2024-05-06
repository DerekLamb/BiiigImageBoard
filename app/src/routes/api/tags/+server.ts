import { json } from '@sveltejs/kit'
import imageController from '$lib/server/controllers/imageController';
import { TagModel } from '$lib/server/models/tagModel';

let tags: string[] = [];


export async function GET(event: any) {
    try {
        tags = await TagModel.getAll();
        tags.filter((tag) => tag);
        console.log(tags);
        return json(tags);
        
    } catch (e) {
        console.error(e);
        return json({ success: false });
    }
}

export async function POST({ request } : Request){
    try {
        const body = await request.json();
        console.log(body);
        // Insert the image tags into the collection
        await imageController.updateImageProperty(body.imageID, "tags", body.tags);
        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}