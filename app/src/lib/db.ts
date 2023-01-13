import { MongoClient } from "mongodb/mongodb";
// import { DB_URI } from "$env/static/private";

const DB_URI = ""

const client = new MongoClient(DB_URI)

await client.connect()

export default client.db('dealership') //select database