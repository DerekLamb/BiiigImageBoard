import { ObjectId, type Document, } from 'mongodb'

interface appDocument extends Document { 
    _id? : string;
    [key: string] : any;
}

interface dbDocument extends Document { 
    _id? : ObjectId;
    [key: string] : any;
}


export const databaseDocUtil = {

    convertIdToString<T>( doc: dbDocument ): appDocument {
        const { _id, ...rest } = doc;

        if( !_id ) {
            return { 
                ...rest,
            }
        }

        return {
        ...rest,
        _id: _id.toString()
        } as appDocument;
    },
    
    convertStringToId<T>( doc: appDocument ): dbDocument {
        const { _id, ...rest } = doc;

        if( !_id ) {
            return { 
                ...rest,
            }
        }

        const id = new ObjectId( doc._id ); // possibly add auto id generate
        return { ...rest, _id: id } as dbDocument; // Convert string to ObjectId
    },

    
}