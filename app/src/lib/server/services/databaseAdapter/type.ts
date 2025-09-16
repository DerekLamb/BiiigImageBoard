

// databases will be handled on a table by table basis. 
// TODO Combining tables like group and images need to be addressed 

export interface databaseAdapter{ // Database will store metadata for content metadata, group metadata, and user data.

    getDocument(id:string): Promise<any>

    insertDocument(id: string): Promise<boolean>

    searchByField(field: string, searchterm: string): Promise<any[]>

    searchByFieldSingle(field: string, searchterm: string): Promise<any>

    updateDocument(imageDoc: any): Promise<any> // not concerned about safety now but will in the future

}