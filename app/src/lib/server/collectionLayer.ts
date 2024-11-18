import { Collection } from "mongodb";
import { databaseDocUtil as dbUtil } from "./utility/dbUtil";


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
        
        async insertOne( document: Array<any>, options?:Array) {
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

        async replaceOne( query = {}, newDocument: Array<any>) {
            if( Object.keys(query).length === 0 ){
                throw Error("Unsafe replaceOne Operation | Empty Query")
            }

            const mongoQuery = dbUtil.convertStringToId(query);

            const result = collection.replaceOne(mongoQuery, newDocument);
            return dbUtil.convertIdToString(result);
        },

        async deleteOne( query = {} ) {
            if( Object.keys(query).length === 0 ){
                throw Error("Unsafe deleteOne Operation | Empty Query")
            }
        },

        async estimateQueryCount() {
            return collection.estimatedDocumentCount();
        }
    }
}