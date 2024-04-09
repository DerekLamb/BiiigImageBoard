import { Lucia } from 'lucia';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { db } from '$lib/db';
import type { Collection } from 'mongodb';


export const User = db.collection('users') as Collection<UserDoc>;
export const Session = db.collection('sessions') as Collection<Session>;

const adapter = new MongodbAdapter(db.collection('sessions'), User);

interface DatabaseUserAttributes {
    username: string;
    passwordHash: string;
    role: string;
    passwordChangeRequired: boolean;
}

interface UserDoc { //extends DatabaseUserAttributes 
	_id: string;
    username: string;
    passwordHash: string;
    role: string;
    passwordChangeRequired: boolean;
}

interface Session {
	_id: string;
	expires_at: Date;
	user_id: string;
}


export const lucia = new Lucia( adapter, {
    sessionCookie: {
        attributes: {
            secure: true // need to add dev env check TODO
        }
    },
    getUserAttributes: (attributes) => {
        return {
            username: attributes.username

        }
    }
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof Lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}



