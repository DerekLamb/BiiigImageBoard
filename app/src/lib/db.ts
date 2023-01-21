import { MongoClient } from "mongodb"
// import { DB_URI } from "$env/static/private";

const DB_URI = "mongodb://localhost:27017"

const client = new MongoClient(DB_URI)

await client.connect()

export default client.db('bib') //select database