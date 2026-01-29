import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/db.server';

/** @type {import('./$types').Actions} */

export async function load ({ url }) {
    const userCount = await db.collection("users").countDocuments();

    if (userCount > 0 ) {
        throw redirect(303, '/login');
    }

    return {};
}

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        if (!email || !password || !name) {
            return fail(400, { message: 'Email, Name, and password are required.' });
        }

        const userCount = await db.collection("users").countDocuments();
        if (userCount > 0) {
            return fail(403, { message: 'Application already initialized.' });
        }

        try {
            const session = await auth.api.signUpEmail({
                body: {
                email,
                password,
                name
                }
            });

            if (!session) {
                return fail(500, { message: 'Failed to create admin user.' });
            }
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'An error occurred during initialization.' });
        }

        throw redirect (303, '/config');

        }
    }