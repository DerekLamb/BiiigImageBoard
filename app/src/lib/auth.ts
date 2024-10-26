import { Lucia, generateId } from 'lucia';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { db } from '$lib/db.server';
import type { Collection } from 'mongodb';
import { Argon2id } from 'oslo/password';


export const User = db.collection('users') as Collection<UserDoc>;
export const Session = db.collection('sessions') as Collection<Session>;

const adapter = new MongodbAdapter(db.collection('sessions'), User);

interface DatabaseUserAttributes {
    username: string;
    passwordHash: string;
    role: string;
    passwordChangeRequired: boolean;
}

interface UserDoc { //needs to mirror DatabaseUserAttributes (ignore _id)
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


export const initialize = async () => {

    if( await db.collection('users').countDocuments() === 0){

        const userId = generateId(15);
		const hashedPassword = await new Argon2id().hash('myOwnPersonalApp');

        User.insertOne({
            _id: userId,
            username: 'admin',
            passwordHash: hashedPassword,
            role: 'admin',
            passwordChangeRequired: true
        });
    }
}

declare module 'lucia' {
    interface Register {
        Lucia: typeof Lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}