import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { start_mongo } from "$lib/db.server";

start_mongo().then(() => {
    console.log("Connected to MongoDB")
    }).catch((err) => {
        console.error(err);
    });


export async function handle ({ event, resolve}) {

    const session = await auth.api.getSession({
        headers: event.request.headers,
    })

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
    }

    return svelteKitHandler({ event, resolve, auth, building})
}