import { redirect, error } from "@sveltejs/kit";
import ImageController from "$lib/server/controllers/imageController.js";
import { auth, isAdmin } from "$lib/auth";

/** @type {import('./$types').Actions} */

export const load = async ({ request }) => {
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }
};

export const actions = {
    default: async ({ locals }) => {
        if (!locals.user) {
            throw redirect(307, '/login');
        }

        if (!isAdmin(locals.user)) {
            throw error(403, 'Admin access required');
        }

        try {
            ImageController.updateAllThumbnails();
        } catch (err) {
            console.error(err);
            return {
                status: 500,
                error: 'Internal server error'
            };
        }

        return {
            status: 200,
            body: { message: "Images Checked!" }
        };
    }
};
