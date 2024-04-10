import { MongoClient } from "mongodb";
import { env } from "$env/dynamic/private";

const DB_URI = env.DB_URI || "mongodb://localhost:27017";
const dbName = 'bib';
const client = new MongoClient(DB_URI);

export function start_mongo() {
    console.log("Connecting to MongoDB");
    return client.connect();
}

export const db = client.db(dbName);
