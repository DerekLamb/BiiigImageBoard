import crypto from "crypto"

class FileHashingMachieeeene {
    constructor(){
    }

    async fileHashMaker(fileData: Buffer) {
       
        const uint8buffer = new Uint8Array(fileData.buffer, fileData.byteOffset, fileData.byteLength)

        try {
            return crypto
            .createHash('sha256')
            .update(uint8buffer)
            .digest('hex')
            .slice(0,24);
        } catch (error) {
            throw new Error(`Error hashing file: ${error}`);
        }
    }
}
