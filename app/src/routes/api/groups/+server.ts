import { json } from '@sveltejs/kit'
import groupController from '$lib/server/controllers/groupController.js';
import { UUID } from 'mongodb';
import { imageCollection } from '$lib/server/types.js';
import imageController from '$lib/server/controllers/imageController.js';
import { aggregateController } from '$lib/server/controllers/aggController';

export async function POST( request: Request ){
    // user access check here TODO
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    const body = await request.json();

    // expected body: { group: { name: string}, addDocuments: { id: string, }[] } 

    if( !body.hasOwnProperty('group') || !body.hasOwnProperty('addDocuments') ) {
        return json({ success: false, message: "missing group or addDocuments" });
    }
    
    // get existing children documents
    // $addToSet dragged image to children
    // user access check here TODO
    // return success or failure
    
    try { 
        console.log(body);

        // group id
        let groupID = body.group;
        let newChildren : string[] = body.addDocuments;

        let parentGroup = groupController.getGroupById(groupID);
        
        // check if group id is new/exists ( create if new ) TODO: change to group name
        if(!parentGroup) {
            // create group 
            let name = body.name || "new group:" + new UUID().toString().slice(0, 5);
            await groupController.createGroup(name, [body.draggedImage, body.draggedOverImage]);
            
        } 
        // add children to existing group
        // let results = await groupController.addToGroup(groupID, [body.draggedImage, body.draggedOverImage]);

        newChildren.forEach( async (child) => { 
            
            let document =  aggregateController.getAggregated({page: 0, length: 10, group: child, sort: 'uploadDate'}); //TODO HERE
            await groupController.addToGroup(groupID, document, document.type );
            // imageController function here ( add to group in a safe non destructive way)
        })
        

        imageCollection.updateOne({ _id: body.draggedImage }, { $push: { groups: insertedId } });
        imageCollection.updateOne({ _id: body.draggedOverImage }, { $push: { groups: insertedId } });
        
        let insertedId = results.insertedId.toString();
        console.log(insertedId);
        imageCollection.updateOne({ _id: body.draggedImage }, { $push: { groups: insertedId } });
        imageCollection.updateOne({ _id: body.draggedOverImage }, { $push: { groups: insertedId } });
        

        if(!parentGroup){
            GroupModel.createGroup({name: new Date().toISOString(), 
                uploadDate: new Date().toISOString(), 
                children: [body.draggedImage, body.draggedOverImage], 
                groups: [], 
                groupType: 'default', 
                groupTags: []});
            
        }

        // Insert image into group collection if first element is image 

        return json({ success: true });
    } catch (e) {

        console.error(e);
        return json({ success: false });
        
    }
}

export async function GET({ params } ) {
    // user access check TODO
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

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