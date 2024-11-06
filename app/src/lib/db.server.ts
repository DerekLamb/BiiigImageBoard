import { MongoClient } from "mongodb";
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

export function start_mongo() {
    console.log("Connecting to MongoDB");

    // setup indexes + other 
    client.db(dbName).collection(collections.images).createIndex({uploadDate: 1});
    
    return client.connect();
}


