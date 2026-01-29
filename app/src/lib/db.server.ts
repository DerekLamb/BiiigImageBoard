import { MongoClient, } from "mongodb";
import { env } from "$env/dynamic/private";

const DB_URI = env.DB_URI || "mongodb://localhost:27017";
const dbName = 'bib';
const client = new MongoClient(DB_URI);

export const db = client.db(dbName);

export const collections = {
    images : "testimages",
    users : "users",
    sessions : "sessions",
    groups: "groups",
    //config : "config"
}

export const groupCollection = db.collection(collections.groups);
export const imageCollection = db.collection(collections.images);
export const userCollection = db.collection(collections.users);
export const sessionCollection = db.collection(collections.sessions);

export function start_mongo() {
    console.log("Connecting to MongoDB");

    // setup index
    client.db(dbName).collection(collections.images).createIndex({uploadDate: 1});
    
    return client.connect();
}


