import { json } from '@sveltejs/kit'
import db from '$lib/db'
import { imageRepo } from '$lib/imageRepository';

let tags: string[] = [];


export async function GET(event: any) {


    return json({ tags: tags})
}

export async function POST({ request } : Request){
    try {
        const body = await request.json();
        console.log(body);
        // Insert the image tags into the collection
        //await db.collection('testimages').updateOne({genName: body.imageID}, { $set: {'tags':body.tags} });
        await imageRepo.updateByTimestamp(body.imageID, {tags: body.tags});
        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}