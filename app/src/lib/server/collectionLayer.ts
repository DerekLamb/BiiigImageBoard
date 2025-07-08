import { Collection, type Document, type Filter, type FindOptions, type Sort } from "mongodb";
import { databaseDocUtil as dbUtil } from "$lib/server/utility/dbUtil";



export const createMongoCollection = (collection: Collection) => {
    return {
        async find(query:Filter<any> = {}) {
            try {
                console.log(query);
                const mongoQuery = dbUtil.convertStringToId(query);
                const docs = await collection.find(mongoQuery).toArray();
                return docs.map(dbUtil.convertIdToString);
            } catch (error: any) {
                throw new Error(`Find operation failed: ${error.message}`);
            }
        },

        async findPage(query = {}, limit = 10, skip = 0, sort: Sort = {uploadDate: -1}) {
            try {
                const mongoQuery = dbUtil.convertStringToId(query);
                const result = await collection.find(mongoQuery)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                return result.map(dbUtil.convertIdToString);
            } catch (error: any) {
                throw new Error(`FindPage operation failed: ${error.message}`);
            }
        },

        async findOne(query = {}, options: FindOptions = {}) {
            try {
                
                const mongoQuery = dbUtil.convertStringToId(query);
                const result = await collection.findOne(mongoQuery, options);

                if (!result) {
                    return null;
                }
                
                return dbUtil.convertIdToString(result);
            } catch (error: any) {
                throw new Error(`FindOne operation failed: ${error.message}`);
            }
        }, 
        
        async insertOne(document: Document) {
            if (!document) {
                throw new Error("InsertOne operation failed: Document is required");
            }
            
                const mongoDoc = dbUtil.convertStringToId(document);
                const result = await collection.insertOne(mongoDoc);
                return result
        },

        async updateOne(query = {}, update: any | { $set: any }) {
            if (Object.keys(query).length === 0) {
                throw new Error("Unsafe updateOne operation: Empty query");
            }
            
            try {
                const mongoQuery = dbUtil.convertStringToId(query);
                const updateDoc = update.$set ? update : { $set: update };
                
                const result = await collection.findOneAndUpdate(
                    mongoQuery,
                    updateDoc,
                    { returnDocument: 'after' }
                );
                
                if (!result) {
                    return null;
                }
                
                return dbUtil.convertIdToString(result);
            } catch (error: any) {
                throw new Error(`UpdateOne operation failed: ${error.message}`);
            }
        },

        async replaceOne(query = {}, newDocument: Document) {
            if (Object.keys(query).length === 0) {
                throw new Error("Unsafe replaceOne operation: Empty query");
            }
            
            if (!newDocument) {
                throw new Error("ReplaceOne operation failed: New document is required");
            }
            
            try {
                const mongoQuery = dbUtil.convertStringToId(query);
                const mongoDoc = dbUtil.convertStringToId(newDocument);
                
                const result = await collection.replaceOne(mongoQuery, mongoDoc);
                return result;
            } catch (error: any) {
                throw new Error(`ReplaceOne operation failed: ${error.message}`);
            }
        },

        async deleteOne(query = {}) {
            if (Object.keys(query).length === 0) {
                throw new Error("Unsafe deleteOne operation: Empty query");
            }
            
            try {
                const mongoQuery = dbUtil.convertStringToId(query);
                const result = await collection.deleteOne(mongoQuery);
                return result;
            } catch (error: any) {
                throw new Error(`DeleteOne operation failed: ${error.message}`);
            }
        },

        async estimateDocumentCount() {
            try {
                return await collection.estimatedDocumentCount();
            } catch (error: any) {
                throw new Error(`EstimateDocumentCount operation failed: ${error.message}`);
            }
        }, 

        async countDocuments(filter = {}) {
            try{
                return await collection.countDocuments(filter);
            } catch (error: any) {
                throw new Error(`Document Count operation failed: ${error.message}`)
            }
        }
    };
}