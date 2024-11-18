import { Collection, MongoClient, ObjectId, type Filter } from "mongodb";
import { env } from "$env/dynamic/private";
import { databaseDocUtil as dbUtil } from "$lib/server/utility/dbUtil";

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



export const createMongoCollection = (collection: Collection) => {
    return {
        async find( query = {} ) {
            const mongoQuery = dbUtil.convertStringToId(query);
            const docs = await collection.find(mongoQuery).toArray();
            return docs.map(dbUtil.convertIdToString);
        },
        async findOne( query = {} ) {
            const mongoQuery = dbUtil.convertIdToString(query);
            const result = collection.findOne(mongoQuery)
            return dbUtil.convertIdToString(result)
        }, 
        
        async insertOne( document: Array<any> ) {
            try {
                const mongoDoc = dbUtil.convertIdToString(document)
                const result = await collection.insertOne(mongoDoc);
                return dbUtil.convertStringToId(result);
            } catch (error: any) {
                throw new Error(`InsertOne operation failed: ${error.message}`);
              }
        },

        async updateOne( query = {}, update: any  | { $set: any }) {
            try {
            const mongoQuery = dbUtil.convertStringToId(query);
            const updateDoc = update.$set ? update : { $set: update };
              
            const result = await collection.findOneAndUpdate(
                mongoQuery,
                updateDoc,
                { returnDocument: 'after' }
            );
        
                return dbUtil.convertIdToString(result);
            } catch (error) {
                throw new Error(`UpdateOne operation failed: ${error.message}`);
            }
          },

    }
}

export function start_mongo() {
    console.log("Connecting to MongoDB");

    // setup indexes + other 
    client.db(dbName).collection(collections.images).createIndex({uploadDate: 1});
    
    return client.connect();
}


