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
        
        let results = await groupController.deleteGroup(groupId); //TODO add some user access and safety sprinkles 

        console.log(results);

        redirect(303, '/postGroups');
    },

    removeImage: async ({ request, locals }) => {
        console.log("got here");
        if (!locals.user) {
            redirect(307, '/login');
        }

        const data = await request.formData();
        const groupId = data.get("groupId") as string;
        const imageId = data.get("imageId") as string;
        
        if (!groupId || !imageId) {
            throw new Error("Group ID or Image ID not provided");
        }
        
        try{
            let preEditGroup = await groupController.getGroup(groupId);
            let editedChildren  = preEditGroup.children.filter( e => e != imageId);

            let preEditImage = await imageController.getImage(imageId);
            let editedGroups = preEditImage.group.filter(e => e != groupId);

            console.log(editedChildren);
            console.log(editedGroups);

            await groupController.updateGroup(groupId, {children:editedChildren})
            await imageController.updateImageProperty(imageId, "group", editedGroups )
        } catch(error) {
            throw new Error("Error updating group/image document:", error)
        }

        redirect(303, `/postGroups/${groupId}`);
    }
}