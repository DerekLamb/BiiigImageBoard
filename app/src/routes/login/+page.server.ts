import { fail, redirect } from "@sveltejs/kit";

//import type { Actions } from "./$types";

interface UserDoc {
    _id: string;
    username: string;
    passwordHash: string;

}


export const actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        
        if ( typeof username !== "string" || 
            username.length < 4 || 
            username.length > 31 ||
            !/^[a-zA-Z0-9_-]*$/.test(username) ) {
            return fail(400, { error: "Invalid username" });
        }

        if ( typeof password !== "string" || 
            password.length < 8 || 
            password.length > 255 ) {
            return fail(400, { error: "Invalid password" });
        }

        const existingUser = await db.collection("users").findOne({ username:username });
        if ( !existingUser ){
            // add timeout in future for bruteforce failout
            new Argon2id().hash(password); //Trash hash to prevent timing attacks
            return fail(400, { error: "Incorrect username or password" });
        }

        const userDoc: UserDoc = {
            _id: existingUser._id.toString(),
            username: existingUser.username,
            passwordHash: existingUser.passwordHash
        };

        const validPassword = await new Argon2id().verify(existingUser.passwordHash, password);

        console.log(await new Argon2id().hash(password))

        if ( !validPassword ){
            return fail(400, { error: "Incorrect username or password" });
        }

        const session = await lucia.createSession(userDoc._id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path:".",
            ...sessionCookie.attributes
        });

        console.log("Got here");

        redirect(302, "/");

    }
}