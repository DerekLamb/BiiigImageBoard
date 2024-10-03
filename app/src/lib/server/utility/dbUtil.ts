import {ObjectId} from 'mongodb'

type WithStringId<T> = Omit<T, '_id'> & { _id: string };
type WithObjectId<T> = T & { _id: ObjectId };

export const databaseDocumentUtil = {

    convertIdToString<T>(doc: WithObjectId<T>): WithStringId<T> {
        const { _id, ...rest } = doc;
        return {
        ...rest,
        _id: _id.toString()
        };
    },
    
    toDatabase(document: {_id: string}): {} {
        const id = new ObjectId(document._id);
        return { ...document, _id: id } as ImageDoc; // Convert string to ObjectId
    },
}