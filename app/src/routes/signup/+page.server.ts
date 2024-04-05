import { lucia, User } from "$lib/auth";
import { fail, redirect } from "@sveltejs/kit";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";



export const actions = { 
    default: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        // username must be between 4 ~ 31 characters, and only consists of letters, 0-9, -, and _
        // password must be between 6 ~ 255 characters

        if( 
            typeof username !== "string" ||
            typeof password !== "string" ||
            username.length < 4 || 
            username.length > 31 ||
            !/^[a-zA-Z0-9_-]*$/.test(username)
        ){
            console.log("failout");
            return fail(400, { error: "Invalid username or password" });
            
        }

        if (typeof password !== "string" || 
            password.length < 8 || 
            password.length > 255) {
			return fail(400, { error: "Invalid password" });//update to display password requirements
        }

        if ( await User.findOne({ username: username }) ) {
            return fail(400, { error: "Username already taken" });
        }

		const userId = generateId(15);
		const hashedPassword = await new Argon2id().hash(password);
        await User.insertOne({ _id: userId ,username: username, passwordHash: hashedPassword });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path:".",
            ...sessionCookie.attributes
        });

        console.log("User created and logged in");

        redirect(302, "/");
    }
}