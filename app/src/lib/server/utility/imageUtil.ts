import sharp from "sharp";

export const imageFileUtil = {

    async createImageThumbnail(imgBuffer: Buffer , scale: number = 200): Promise<Buffer> { // want to add webm support for thumbnail creation TODO
        // file extension check here
        try {
            return await sharp(imgBuffer)
                .resize({ width: scale})
                .webp()
                .toBuffer();
        } catch (error) {
            throw new Error(`Error creating thumbnail: ${error}`);
        }
    },

    
    
}
