import {ObjectId} from 'mongodb'

type WithStringId<T> = Omit<T, '_id'> & { _id: string };
type WithObjectId<T> = Omit<T, '_id'> & { _id: ObjectId };

export const databaseDocUtil = {

    convertIdToString<T>(doc: WithObjectId<T>): WithStringId<T> {
        const { _id, ...rest } = doc;
        return {
        ...rest,
        _id: _id.toString()
        } as WithStringId<T>;
    },
    
    convertStringToId<T>(doc: WithStringId<T>): WithObjectId<T> {
        const id = new ObjectId(doc._id);
        return { ...doc, _id: id }; // Convert string to ObjectId
    },
}