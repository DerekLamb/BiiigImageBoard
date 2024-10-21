import {ObjectId} from 'mongodb'

type WithStringId<T> = T & { _id: string };
type WithObjectId<T> = T & { _id: ObjectId };

export const databaseDocUtil = {

    convertIdToString<T>(doc: WithObjectId<T>): WithStringId<T> {
        const { _id, ...rest } = doc;
        return {
            ...rest,
            _id: _id.toString()
        };
    },
    
    convertStringToId<T>(doc: WithStringId<T>): WithObjectId<T> {
        const { _id, ...rest} = doc;
        return { 
            ...rest,
            _id: new ObjectId(_id) 
        }; 
    },
}