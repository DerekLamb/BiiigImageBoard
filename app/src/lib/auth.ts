import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { ObjectId } from 'mongodb';
import { db } from '$lib/db.server';
import { env } from '$env/dynamic/private';

// User type with role for use throughout the app
export interface UserWithRole {
	id: string;
	email: string;
	name: string;
	image?: string | null;
	role: string;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Better-Auth configuration with role support and admin-only signup
export const auth = betterAuth({
	experimental: { joins: true },
	database: mongodbAdapter(db),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
	basePath: '/api/auth',
	// Deployment-safe origin/CSRF check: in addition to the baseURL default,
	// trust the origin that matches the host this request was sent to.
	// The app and its API are always served from the same origin (vite in dev,
	// nginx in prod), so a legitimate request's Origin always equals its Host;
	// cross-site requests (Origin != Host, e.g. login CSRF from another domain)
	// are still rejected. This lets login work on localhost, a LAN IP during
	// mobile dev, and the production domain without per-environment config.
	trustedOrigins: (request) => {
		const host = request?.headers.get('host');
		if (!host) return [];
		return [`https://${host}`, `http://${host}`];
	},
	session: {
		cookieCache: {
			enabled: true
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	},
	plugins: [sveltekitCookies(getRequestEvent)],
	user: {
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'user',
				required: true,
				// Never accept the role from the client. Sign-up payloads are
				// parsed with this flag, so only trusted server code (the admin
				// action, after the admin check in the hook below) may assign it.
				input: false
			},
			passwordChangeRequired: {
				type: 'boolean',
				defaultValue: true
			}
		}
	},

	hooks: {
		before: async (ctx) => {
			// better-auth 1.6 types this hook as receiving the middleware *input*
			// context, but it is invoked with the full middleware context at
			// runtime (endpoint `path`, request `headers`, resolved
			// `context.session`). Cast to the runtime shape until the upstream
			// types are fixed.
			const hookCtx = ctx as unknown as {
				path?: string;
				headers?: Headers;
				context: { session?: { user?: { role?: string } } | null };
			};

			// Account creation is admin-only. The configured admin is seeded by
			// initializeAdminUser(), so there is no anonymous first-signup path:
			// without this check any logged-in user could create accounts, and
			// could grant themselves the admin role.
			const isSignUp = hookCtx.path?.includes('/sign-up') ?? false;
			if (isSignUp) {
				// The sign-up endpoint does not resolve a session itself, and
				// server-side `auth.api.*` calls (the admin panel) have no resolved
				// `context.session` either - resolve it from the request headers
				// before checking the role.
				const session =
					hookCtx.context.session ??
					(hookCtx.headers ? await auth.api.getSession({ headers: hookCtx.headers }) : null);

				if (session?.user?.role !== 'admin') {
					throw new Error('Only admins can create new accounts. Contact your administrator.');
				}
			}

			return { context: hookCtx.context };
		}
	}
});

const CREDENTIAL_PROVIDER_ID = 'credential';

/**
 * Convert a Better Auth id string to the value the MongoDB adapter stores in
 * `_id` for that id. The adapter coerces id-like strings to `ObjectId`, so raw
 * driver queries must do the same or they silently match nothing.
 */
export function toDbId(id: string): string | ObjectId {
	try {
		return new ObjectId(id);
	} catch {
		return id;
	}
}

// Shape of the Better Auth `account` documents this module writes. Typing the
// collection keeps the driver from demanding an ObjectId `_id` (Better Auth
// generated ids are strings).
interface AccountDoc {
	_id: string;
	id: string;
	userId: string | ObjectId;
	accountId: string;
	providerId: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Ensure the Better Auth `account` document required for email/password
 * sign-in exists for a user.
 *
 * A `user` document alone is not enough: Better Auth verifies credentials
 * against an `account` row with `providerId: 'credential'`. Users created by
 * the previous auth system, by earlier versions of this initialization code,
 * or by a sign-up that failed between the user and account inserts can exist
 * without one. Such a user is "taken" (the sign-up hook blocks re-creation)
 * but can never authenticate - a catch-22.
 *
 * Safety rules:
 * - Creates the account only when the user has no credential account yet.
 * - Never overwrites an existing account/password, so a boot can never
 *   silently reset credentials.
 * - Uses the user id as `accountId`, matching Better Auth's own convention.
 * - Idempotent and tolerant of concurrent boots: losing the insert race is
 *   reported as "not created" instead of throwing.
 *
 * @returns true when a new credential account was created, false otherwise.
 */
export async function ensureCredentialAccount(
	userId: string | ObjectId,
	password: string
): Promise<boolean> {
	const accounts = db.collection<AccountDoc>('account');
	// Accept either the raw user `_id` or the Better Auth id string; both end
	// up as the value the adapter stores, because Better Auth's account join
	// compares account.userId directly against the user document's _id.
	const dbUserId = typeof userId === 'string' ? toDbId(userId) : userId;
	const credentialFilter = { userId: dbUserId, providerId: CREDENTIAL_PROVIDER_ID };

	if (await accounts.findOne(credentialFilter)) {
		return false;
	}

	const { hashPassword } = await import('@better-auth/utils/password');
	const hashedPassword = await hashPassword(password);
	const accountDocId = crypto.randomUUID ? crypto.randomUUID() : `acct-${Date.now()}`;

	try {
		await accounts.insertOne({
			_id: accountDocId,
			id: accountDocId,
			userId: dbUserId,
			// Better Auth uses the user id as the credential accountId.
			accountId: String(dbUserId),
			providerId: CREDENTIAL_PROVIDER_ID,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		return true;
	} catch (error) {
		// Another process may have created the account after our findOne.
		if (await accounts.findOne(credentialFilter)) {
			return false;
		}
		throw error;
	}
}

/**
 * Initialize the environment-configured admin user.
 * Call this after the DB connection is established.
 *
 * This must not assume that an existing `user` document has a matching
 * credential `account`: after migrating from the previous auth system the user
 * can be present while the account is missing, and the catch-22 above would
 * otherwise leave the deployment with no way to log in.
 */
export async function initializeAdminUser(): Promise<boolean> {
	if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
		console.log('Admin credentials not configured in environment');
		return false;
	}

	// Better Auth stores/looks up emails in lower case; normalize so the filter
	// cannot miss an existing document because of casing.
	const email = env.ADMIN_EMAIL.trim().toLowerCase();
	const users = db.collection('user');

	try {
		// Upsert the user document. `$setOnInsert` generates a stable id on a
		// fresh database; `$set` makes sure the configured admin can reach the
		// admin UI even when the document predates Better Auth.
		const newUserId = crypto.randomUUID ? crypto.randomUUID() : `admin-${Date.now()}`;
		const now = new Date();

		await users.updateOne(
			{ email },
			{
				$setOnInsert: {
					_id: newUserId,
					id: newUserId,
					email,
					name: 'Admin',
					passwordChangeRequired: true,
					createdAt: now
				},
				$set: {
					role: 'admin',
					emailVerified: true,
					updatedAt: now
				}
			},
			{ upsert: true }
		);

		const adminUser = await users.findOne({ email });
		if (!adminUser) {
			throw new Error('Admin user document was not created');
		}

		const accountCreated = await ensureCredentialAccount(adminUser._id, env.ADMIN_PASSWORD);

		if (accountCreated) {
			// The env password is known to the operator and must be changed.
			await users.updateOne(
				{ _id: adminUser._id },
				{ $set: { passwordChangeRequired: true, updatedAt: new Date() } }
			);
		}

		console.log(accountCreated ? 'Admin user created successfully' : 'Admin user already exists');
		return true;
	} catch (error) {
		console.error('Failed to initialize admin user:', error);
		return false;
	}
}

/**
 * Check if a user has admin role
 */
export function isAdmin(user: { role?: string } | null): boolean {
	return user?.role === 'admin';
}
