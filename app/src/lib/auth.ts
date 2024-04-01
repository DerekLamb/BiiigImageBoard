import { Lucia, type Adapter } from 'lucia';
import { db } from '$lib/db';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import type { Collection } from 'mongodb';

export const User = db.collection('users') as Collection<UserDoc>;
export const Session = db.collection('sessions') as Collection<SessionDoc>;

const adapter = new MongodbAdapter(Session, User) as MongodbAdapter;

interface UserDoc {
    _id: string;
}

interface SessionDoc {
    _id: string; 
    expires_at: Date,
    user_id: string;
}

export const lucia = new Lucia( adapter, {
    sessionCookie: {
        attributes: {
            secure: false // need to add dev env check instead TODO
        }
    }
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof Lucia;
    }
}

interface DatabaseUserAttribues {
    username: string;
}

