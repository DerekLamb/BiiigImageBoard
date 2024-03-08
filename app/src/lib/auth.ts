import { Lucia, type Adapter } from 'lucia';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { Collection, MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

export const db = client.db();
const User = db.collection('users') as Collection<UserDoc>;
const Session = db.collection('sessions') as Collection<SessionDoc>;

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
            secure: false
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

