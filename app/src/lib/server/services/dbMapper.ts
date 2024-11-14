import { ObjectId } from "mongodb";


const createMongoCollection = (collection) => {
    return {
        async find(query = {}) {
            const mongoQuery = toClient(query);
            const docs = await collection.find(mongoQuery).toArray();
            return toClient(docs)
        },
        async findOne(query = {}) {
            const mongoQuery = toDB(query);
            
        } 
    }
}