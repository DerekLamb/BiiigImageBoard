import { Lucia } from 'lucia';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { db } from '$lib/db';
import type { Collection } from 'mongodb';


export const User = db.collection('users') as Collection<UserDoc>;
export const Session = db.collection('sessions');

const adapter = new MongodbAdapter(db.collection('sessions'), User);

interface UserDoc {
	_id: string;
}

interface Session {
	_id: string;
	expires_at: Date;
	user_id: string;
}


export const lucia = new Lucia( adapter, {
    sessionCookie: {
        attributes: {
            secure: false // need to add dev env check TODO
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

interface DatabaseUserAttributes {
    username: string;
}

