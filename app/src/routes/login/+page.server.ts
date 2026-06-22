import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth.js"

// With better-auth, authentication is handled client-side via the auth client
// Server-side we just check if user is already logged in and redirect

export async function load({ request }) {
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }
    return {};
}
