import { Collection, type Document, type Sort } from "mongodb";
import { databaseDocUtil as dbUtil } from "./utility/dbUtil";


export const createMongoCollection = (collection: Collection) => {
    return {
        async find( query = {} ) {
            const mongoQuery = dbUtil.convertStringToId(query);
            const docs = await collection.find(mongoQuery).toArray();
            return docs.map(dbUtil.convertIdToString);
        },

        async findPage( query = {}, limit = 10, skip = 0, sort: Sort = {uploadDate: -1}  ){
            const mongoQuery = dbUtil.convertStringToId(query);

            const result = await collection.find(mongoQuery).sort(sort).skip(skip).limit(limit).toArray()
            return result.map(dbUtil.convertIdToString)
        },

        async findOne( query = {} ) {
            const mongoQuery = dbUtil.convertIdToString(query);
            const result = await collection.findOne(mongoQuery)
            if( !result ){
                throw new Error("findOne result query: " + query + " found no results");
                
            }
            return dbUtil.convertIdToString(result)
        }, 
        
        async insertOne( document: Document ) {
            try {
                const mongoDoc = dbUtil.convertIdToString(document)
                const result = await collection.insertOne(mongoDoc);
                return dbUtil.convertStringToId(result);
            } catch (error: any) {
                throw new Error(`InsertOne operation failed: ${error.message}`);
              }
        },

        async updateOne( query = {}, update: any | { $set: any } ) {
            try {
            const mongoQuery = dbUtil.convertStringToId( query );
            const updateDoc = update.$set ? update : { $set: update };
              
            const result = await collection.findOneAndUpdate(
                mongoQuery,
                updateDoc,
                { returnDocument: 'after' }
            );
        
                return dbUtil.convertIdToString(result);
            } catch (error) {
                throw new Error(`UpdateOne operation failed: ${error}`);
            }
          },

        async replaceOne( query = {}, newDocument: Document ) {
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

            const result = collection.deleteOne(query);

            return result
        },

        async estimateDocumentCount() {
            return collection.estimatedDocumentCount();
        }
    }
}