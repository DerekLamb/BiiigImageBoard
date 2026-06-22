import { auth, initializeAdminUser } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { start_mongo } from "$lib/db.server";

// Initialize MongoDB connection
start_mongo().then(async () => {
    console.log("Connected to MongoDB");
    
    // Initialize admin user if credentials are configured
    await initializeAdminUser();
    }).catch((err) => {
        console.error("MongoDB connection error:", err);
    });

export async function handle({ event, resolve }) {
    return svelteKitHandler({ event, resolve, auth, building });
}
