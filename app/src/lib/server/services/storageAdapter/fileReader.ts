import fs from 'fs/promises';


class FileReader {
    
    constructor( permissionManager ) {
        this._permissionManager = permissionManager;
    }

    async readFile(User, Path: string,) {
        try {
            // if (false) {
            //     return {
            //         success: false,
            //         message: 'Access denied to this directory'
            //     };
            // }

            const fileData = fs.readFile(Path)
                
            return {
                success: true,
                data: fileData,
            };

        } catch (error) {
            return {
                success: false,
                message: `Error saving file: ${error}`
            };
        }
    }

}