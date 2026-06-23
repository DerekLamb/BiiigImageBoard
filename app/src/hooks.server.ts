import { auth, initializeAdminUser } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { start_mongo } from "$lib/db.server";

// Initialize MongoDB connection
start_mongo().then(async () => {
    console.log("Connected to MongoDB");
    await initializeAdminUser();
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

export async function handle({ event, resolve }) {
    // if (building) return resolve(event);

    const session = await auth.api.getSession({
        headers: event.request.headers
    });
    if(session) {
        event.locals.user = session?.user
        event.locals.session = session?.session 

    }

    return svelteKitHandler({ event, resolve, auth, building });
}
