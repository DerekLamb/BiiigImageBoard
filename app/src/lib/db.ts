import { MongoClient } from "mongodb"
import { env } from "$env/static/private";

const DB_URI = env.DB_URI || "mongodb://biiig-image-db:27017"

const client = new MongoClient(DB_URI)

await client.connect()

export default client.db('bib') //select database