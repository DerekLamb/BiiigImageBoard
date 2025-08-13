import fs from "fs/promises"
import crypto from "crypto"
import sharp from 'sharp';
import Ffmpeg from 'fluent-ffmpeg';



export const fileUtils = {

    async checkExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch (error) {
            return false;
        }
    },

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
    },

    async createThumbnail(file: string | Buffer , scale: number = 200, type?: string ): Promise<Buffer> { // want to add webm/avif support for thumbnail creation TODO
        let buffer: Buffer;

        if (typeof file === 'string') {
            try {
                buffer = await this.read(file);
            }
            catch (error) {
                throw new Error(`Error reading file path: ${error}`)
            }
        } else if (typeof file === 'object' && file instanceof Buffer) {
            buffer = file;
        } else {
            throw new Error('Invalid input. Expecting string or Buffer.');
        }

        try {
            return await sharp(buffer)
                .resize({ width: scale})
                .webp()
                .toBuffer();
        } catch (error) {
            throw new Error(`Error creating thumbnail: ${error}`);
        }

    },

    async createVideoThumbnail(filePath: string , thumbnailPath: string)  {
        try { 
            await Ffmpeg(filePath)
            .takeScreenshots({
                count: 1,
                timemarks: [ '1' ] // number of seconds
                }, thumbnailPath);
        } catch (error) {
            throw new Error(`Error creating video thumbnail: ${error}`);
        }

        return 0
    }
}