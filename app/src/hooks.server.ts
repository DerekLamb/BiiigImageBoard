import { lucia, initialize } from "$lib/auth";
import type { Handle } from "@sveltejs/kit";
import { start_mongo } from "$lib/db.server";

start_mongo().then(() => {
    console.log("Connected to MongoDB")
    initialize(); //creates admin user if it doesn't exist
    }).catch((err) => {
        console.error(err);
    });



export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get(lucia.sessionCookieName);
    if(!sessionId){
        event.locals.user = null;
        event.locals.session = null;
        console.log("No session id");
        return resolve(event);
    }

    const { session, user} = await lucia.validateSession(sessionId);

    if( session && session.fresh){
        const sessionCookie = lucia.createSessionCookie(session.id);
        
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: ".",
            ...sessionCookie.attributes
        })
    }	
    
    if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}

    event.locals.user = user;
    event.locals.session = session;
    console.log("Session validated");
    return resolve(event);
}