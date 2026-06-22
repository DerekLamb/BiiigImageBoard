import { auth } from "$lib/auth";
import type { Handle } from "@sveltejs/kit";
import { start_mongo } from "$lib/db.server";

start_mongo().then(() => {
	console.log("Connected to MongoDB");
	auth.initialize();
}).catch((err) => {
	console.error(err);
});

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get("better-auth.session_token");

	let user = null;
	let session = null;

	if (sessionId) {
		try {
			const sessionData = await auth.api.getSession({
				headers: new Headers({
					cookie: `better-auth.session_token=${sessionId}`,
				}),
			});
			if (sessionData) {
				user = sessionData.user;
				session = sessionData.session;
			}
		} catch (err) {
			console.error("Session validation error:", err);
		}
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
