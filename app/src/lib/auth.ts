import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { db } from '$lib/db.server';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	appId: 'biiig-image-board',
	database: mongodbAdapter(db, {
		provider: 'mongodb',
	}),
	secret: env.BETTER_AUTH_SECRET || 'default-secret-change-me',
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'user',
			},
			passwordChangeRequired: {
				type: 'boolean',
				defaultValue: true,
			},
		},
	},
	session: {
		cookiePrefix: 'better-auth',
	},
});

export const initialize = async () => {
	const count = await db.collection('users').countDocuments();
	if (count === 0) {
		await db.collection('users').insertOne({
			id: 'admin',
			name: 'admin',
			email: 'admin@localhost',
			emailVerified: true,
			role: 'admin',
			passwordChangeRequired: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log('Admin user created');
	}
};
