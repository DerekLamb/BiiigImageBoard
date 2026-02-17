import { createAuthClient } from "better-auth/svelte";
import { env } from '$env/dynamic/public';

export const authClient = createAuthClient({
    // Use environment variable or default to localhost
    baseURL: env.PUBLIC_BETTER_AUTH_URL || "https://localhost:5173"
});
