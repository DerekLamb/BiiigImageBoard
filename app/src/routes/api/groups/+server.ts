import { json, redirect } from '@sveltejs/kit'
import groupController from '$lib/server/controllers/groupController.js';
import { aggregateController } from '$lib/server/controllers/aggController';
import { groupNameGenerator } from '$lib/utilityModel.js';
import type { AppImageData, AppGroupData  } from '$lib/server/types.js';

export async function POST( {request, locals} ){
    // user authentication check
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }
    
    // Request body validation ( group: { name: string } )
    let groupName: string;
    try {
        const body = await request.json();
        groupName = body.group?.name;
        
        if (!groupName) {
            return json({ success: false, message: 'Missing group name' }, { status: 400 });
        }
    } catch (e) {
        console.error('Error parsing request body:', e);
        return json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    try {
        // Check if group already exists
        const existingGroup = await groupController.getGroupByName(groupName);
        
        if (existingGroup) {
            return json({ 
                success: true, 
                parentGroupId: existingGroup._id, 
                message: 'Group already exists' 
            });
        }

        // Create new group
        const newGroupId = await groupController.createGroup(groupName);
        
        return json({ 
            success: true, 
            parentGroupId: newGroupId,
            message: 'Group created successfully'
        }, { status: 201 });

    } catch (e) {
        console.error('Error in group operation:', e);
        return json({ 
            success: false, 
            message: 'An error occurred while processing the request' 
        }, { status: 500 });
    }
}


export async function PUT({request, locals}) {
    // user authentication check
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }

    let groupName;
    let childDocuments;

    // Request body validation ( group: { name: string }, addDocuments: string[])
    try {
        const body = await request.json();
        groupName = body.group?.name;
        childDocuments = body.addDocuments;
        
        if (!groupName || !childDocuments) {
            return json({ success: false, message: 'Missing group name' }, { status: 400 });
        }
    } catch (e) {
        console.error('Error parsing request body:', e);
        return json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    let parentGroup = await groupController.getGroupByName(groupName);
    if( !parentGroup ) return json({ success: false, message: "group not found" });
    let parentGroupId = parentGroup._id;

    childDocuments.forEach( async (childId: string) => {
        try{
            let child = await aggregateController.getOneAggregated(childId); // should return one document matching the id 
            if( !child ) return json({ success: false, message: childId + " child not found" });

            await groupController.addToGroup(parentGroupId, childId, child.type);

            } catch (e) {
                console.error('Error adding document to group:', e);
                return json({ success: false, message: 'An error occurred while processing the request' }, { status: 500 });
        }
    });
}

export async function GET({ params, locals } ) {
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