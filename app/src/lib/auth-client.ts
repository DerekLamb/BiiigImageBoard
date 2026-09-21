import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Deployment-safe: by default, talk to the origin the app is served from
// (same-origin). This makes login work on localhost, a LAN IP during mobile
// dev, and the production domain with no env config.
//
// Set PUBLIC_BETTER_AUTH_URL only if the auth API is intentionally served from
// a DIFFERENT origin (e.g. a dedicated auth subdomain) - and add that origin
// to trustedOrigins in $lib/auth.ts.
const sameOrigin = browser ? window.location.origin : 'https://localhost:5173';

export const authClient = createAuthClient({
	baseURL: env.PUBLIC_BETTER_AUTH_URL || sameOrigin
});
