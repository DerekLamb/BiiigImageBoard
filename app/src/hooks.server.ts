import { auth, initializeAdminUser } from '$lib/auth';
import { building } from '$app/environment';
import { start_mongo } from '$lib/db.server';

// Initialize MongoDB connection
start_mongo()
	.then(async () => {
		console.log('Connected to MongoDB');
		await initializeAdminUser();
	})
	.catch((err) => {
		console.error('MongoDB connection error:', err);
	});

const sessionCache = new Map<string, { user: any; session: any; expiresAt: number }>();
const sessionCacheTTL = 60_000;

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
	}
	// Intercept auth requests by PATH, not by origin. The stock svelteKitHandler
	// only intercepts when the request origin equals the configured BETTER_AUTH_URL,
	// so the same app breaks (404s every /api/auth call) when reached under a
	// different hostname - e.g. a LAN IP during mobile dev, or a different
	// prod alias. auth.handler() below is exactly what svelteKitHandler calls on
	// a match; CSRF/origin protection still happens inside better-auth via the
	// trustedOrigins check in $lib/auth.ts.
	const basePath = auth.options.basePath || '/api/auth';
	const { pathname } = event.url;
	if (!building && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
		return auth.handler(event.request);
	}
	return resolve(event);
}
