import { json } from '@sveltejs/kit'
import db from '$lib/db'

let imageDB = db.collection('testImages');
let tags: string[] = [];


export async function GET(event: any) {


    return json({ tags: tags})
}

export async function POST({ request }: Request){
    try {
        const body = await request.json();
        console.log(body);
        // Insert the image tags into the collection
        await db.collection('testimages').updateOne({genName: body.imageID}, { $set: {'tags':body.tags} });

        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}