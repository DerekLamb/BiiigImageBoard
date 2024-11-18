import { ObjectId, type Document} from 'mongodb'

interface appDocument extends Document { 
    id? : string;
    [key: string] : any;
}

interface dbDocument extends Document { 
    id? : ObjectId;
    [key: string] : any;
}


export const databaseDocUtil = {

    convertIdToString<T>(doc: dbDocument): appDocument {
        const { _id, ...rest } = doc;
        return {
        ...rest,
        _id: _id.toString()
        } as appDocument;
    },
    
    convertStringToId<T>(doc: appDocument): dbDocument {
        const id = new ObjectId(doc._id);
        return { ...doc, _id: id } as dbDocument; // Convert string to ObjectId
    },
}