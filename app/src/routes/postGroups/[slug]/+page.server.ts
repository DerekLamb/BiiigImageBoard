import { groupController } from "$lib/server/controllers/groupController";
import imageController from "$lib/server/controllers/imageController";
import { redirect } from '@sveltejs/kit';

export const load= async ({ params, locals }) => {
    if (!locals.user) {
        console.log("no user");
        redirect(307, '/login');
    }
    
    console.log("Group ID:", params.slug);
    const group = await groupController.getGroup(params.slug);
    
    if(!group){
        return{
            status: 404,
            group: null,
            images: []
        }
    }

    // Get images in this group
    const images = [];
    if (group.children && group.children.length > 0) {
        for (const imageId of group.children) {
            const image = await imageController.getImage(imageId);
            if (image) {
                images.push(image);
            }
        }
    }

    return{
        status: 200,
        group: group,
        images: images
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    delete: async ({ request, locals }) => {
        if (!locals.user) {
            redirect(307, '/login');
        }

        const data = await request.formData();
        const groupId = data.get("groupId") as string;
        
        if (!groupId) {
            throw new Error("Group ID not provided");
        }
        
        // Delete logic would go here
        // ...

        redirect(303, '/postGroups');
    },

    removeImage: async ({ request, locals }) => {
        if (!locals.user) {
            redirect(307, '/login');
        }

        const data = await request.formData();
        const groupId = data.get("groupId") as string;
        const imageId = data.get("imageId") as string;
        
        if (!groupId || !imageId) {
            throw new Error("Group ID or Image ID not provided");
        }
        
        // Remove image from group logic would go here

        redirect(303, `/postGroups/${groupId}`);
    }
}