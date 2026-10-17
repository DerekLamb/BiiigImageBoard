import { fail, redirect } from '@sveltejs/kit';
import { auth, toDbId } from '$lib/auth';
import { db } from '$lib/db.server';
import type { ObjectId } from 'mongodb';
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
		// Whitelist the role here: `role` is input:false on the better-auth user
		// schema, so it cannot travel through the sign-up payload and any other
		// value falls back to the schema default ("user").
		const role = formData.get('role') === 'admin' ? 'admin' : 'user';

		if (!email || !password || !name) {
			return fail(400, {
				message: 'Missing required fields',
				email,
				name,
				role
			});
		}

		try {
			// Create the user using the better-auth API. The admin session is
			// forwarded so the sign-up hook can verify the caller is an admin.
			const newUser = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
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

			// The role is applied server-side after creation because the user
			// schema marks it input:false (clients cannot set it). `toDbId` mirrors
			// the adapter's id coercion (id-like strings are stored as ObjectId).
			if (role !== 'user') {
				await db
					.collection<{ _id: string | ObjectId }>('user')
					.updateOne({ _id: toDbId(newUser.user.id) }, { $set: { role, updatedAt: new Date() } });
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
