import { betterAuth } from "better-auth"; 
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { username } from "better-auth/plugins";
import { db } from "$lib/db.server";
import { env } from '$env/dynamic/private';
import type { AuthClient } from "better-auth/client";

// export const User = db.collection('users') as Collection<UserDoc>;
// export const Session = db.collection('sessions') as Collection<Session>;


interface DatabaseUserAttributes {
    username: string;
    passwordHash: string;
    role: string;
    passwordChangeRequired: boolean;
}

interface User { 
}

interface Session {
	_id: string;
	expires_at: Date;
	user_id: string;
}

export const auth = betterAuth ({
    experimental: {joins: true},
    database: mongodbAdapter(db, {

    }),
    emailAndPassword: {
        enabled:true,
    },
    plugins: [
        username() 
    ]

})

export const injectAdmin = (betterAuthClient: AuthClient<any>) => {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        return false;
    }

    const existingAdmin = await betterAuthClient.accountInfo()


}