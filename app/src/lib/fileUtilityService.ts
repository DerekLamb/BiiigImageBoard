import type imageFileService from "$lib/fileService";
import crypto from 'crypto';

class fileUtiltyService {
    private fileServiceObj;
    constructor(fileServiceObj: imageFileService){
        this.fileServiceObj = fileServiceObj;
    }

    //async extractPrompt(){}

    async hashFile(file: string | Buffer): Promise<string> {
        let buffer: Buffer;

        if (typeof file === 'string') {
            buffer = fs.readFileSync(file);
        } else if (typeof file === 'object' && file instanceof Buffer) {
            buffer = file;
        } else {
            throw new Error('Invalid input. Expecting string or Buffer.');
        }
    
        try {
            const hash = crypto.createHash('sha256');
            hash.update(buffer);
            const fsHash = hash.digest('base64').slice(0,12);
            return fsHash;
        } catch (error: any) {
            throw new Error('Error while hashing file: ' + error.message);
        }
    }

}