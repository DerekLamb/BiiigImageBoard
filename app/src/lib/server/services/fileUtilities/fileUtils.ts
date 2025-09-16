import fs from "fs/promises"
import crypto from "crypto"
import sharp from "sharp"
import Ffmpeg from 'fluent-ffmpeg';
import path from "path";



export const fileUtils = {

    async generateFileHashId(fileData: Buffer) {
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

    async generateImageThumbnail(imageData: Buffer , scale: number = 200 ): Promise<Buffer> { 
        try {
            return await sharp(imageData)
                .resize({ width: scale })
                .webp()
                .toBuffer();
        } catch (error) {
            throw new Error(`Error creating thumbnail: ${error}`);
        }
    },

    async createVideoThumbnailPATH(videoImputPath: string, thumbnailOutputPath:string,  timestamp = 2): Promise<void> {
        try { 
            await Ffmpeg(videoImputPath)
            .takeScreenshots({
                count: 1,
                timemarks: [ timestamp ] // number of seconds
              }, thumbnailOutputPath);
        } catch (error) {
            throw new Error(`Error creating video thumbnail: ${error}`);
        }
    }
}