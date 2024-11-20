import { groupController } from '$lib/server/controllers/groupController.js';
import { json, redirect, error} from '@sveltejs/kit';



export async function GET( { params, locals } ) {
    if (!locals.user) { // auth check
        console.log("no user");
        throw redirect(307, '/login');
    }

    if (!params.slug) { // params check
        throw error(400, {
            message: 'Group ID is required'
        });
    }

    try {

        const group = await groupController.getGroup(params.slug);

        if (!group) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        return json({ 
            status:200,
            group: group })
    } catch (err) {
        console.log(`Error fetching group ${params.slug}:`, err);

        throw error(500, {
            message: 'An unexpected error occurred while fetching the group'
        });
    }

}

export async function POST( { params, request, locals } ) {
    if (!locals.user) { // auth check
        console.log("no user");
        throw redirect(307, '/login');
    }

    if (!params.slug) { // params check
        throw error(400, {
            message: 'Group ID is required'
        });
    }


    try {

        const group = await groupController.getGroup(params.slug);

        if (!group) {
            throw error(404, {
                message: `Group with ID ${params.slug} not found`
            });
        }

        const body = json(request.body)

        const groupUpdate = body.group
    
    
}
