import { json } from '@sveltejs/kit'
import groupController from '$lib/server/controllers/groupController.js';
import { UUID } from 'mongodb';
import { imageCollection } from '$lib/server/types.js';
import imageController from '$lib/server/controllers/imageController.js';

export async function POST({ request } : Request){
    // user access check here TODO
    try {
        const body = await request.json();
        console.log(body);

        let name = body.name || "new group:" + new UUID().toString().slice(0, 5);
        let results = await groupController.createGroup(name, [body.draggedImage, body.draggedOverImage]);
        
        let insertedId = results.insertedId.toString();
        console.log(insertedId);
        imageCollection.updateOne({ _id: body.draggedImage }, { $push: { groups: insertedId } });
        imageCollection.updateOne({ _id: body.draggedOverImage }, { $push: { groups: insertedId } });
        

        //GroupModel.getGroupChildren(body.id, body.page, body.limit);
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
        const page = 0;
        const limit = 10;

        const children = [];
        console.log(children);
        return json({ success: true, children });
    } catch (e) {
        console.error(e);
        return json({ success: false });
    }
}