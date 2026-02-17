import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = await locals.session;
    const user = await locals.user;

    if (!session || !user) {
        throw redirect(302, '/login');
    }

    if (user.role !== 'admin') {
        throw redirect(302, '/');
    }

    return {
        user
    };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const session = await locals.session;
        const user = await locals.user;

        if (!session || !user || user.role !== 'admin') {
            return fail(403, {
                message: 'Unauthorized'
            });
        }

        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as string || 'user';

        if (!email || !password || !name) {
            return fail(400, {
                message: 'Missing required fields',
                email,
                name,
                role
            });
        }

        try {
            // Create the user using better-auth API
            // We pass headers to ensure the hook sees the admin session (if needed)
            // However, since we are calling this from the server, we might need to be careful
            // about the hook logic.
            // The hook checks !ctx.context.session.
            // If we pass headers, better-auth should resolve the session.
            
            const newUser = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                    role // Pass the role if your schema allows it in signUp, otherwise we update it after
                },
                headers: request.headers
            });

            if (!newUser) {
                return fail(500, {
                    message: 'Failed to create user',
                    email,
                    name,
                    role
                });
            }

            return {
                success: true,
                message: `User ${email} created successfully`
            };

        } catch (error) {
            console.error('Error creating user:', error);
            // Check if it's the hook error
            if (error instanceof Error) {
                return fail(400, {
                    message: error.message,
                    email,
                    name,
                    role
                });
            }
            return fail(500, {
                message: 'An unexpected error occurred',
                email,
                name,
                role
            });
        }
    }
};
