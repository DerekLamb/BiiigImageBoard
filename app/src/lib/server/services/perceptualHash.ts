/**
 * Perceptual difference hash (dHash) for visual similarity detection.
 *
 * dHash works by:
 * 1. Converting the image to greyscale
 * 2. Resizing to (hashSize+1) x hashSize
 * 3. Comparing each adjacent column of pixels (left vs right)
 * 4. Building a 64-bit hash from these comparisons
 *
 * Similar images produce similar hashes, measured by Hamming distance.
 */
import sharp from 'sharp';

/**
 * Compute a difference hash (dHash) for an image buffer.
 * @param buffer - Raw image buffer (any format sharp supports)
 * @param hashSize - Size of the hash (default 8 produces 64-bit hash)
 * @returns Hex string representing the 64-bit hash (16 hex characters)
 */
export async function dhash(buffer: Buffer, hashSize: number = 8): Promise<string> {
    const { data, info } = await sharp(buffer)
        .greyscale()
        .resize(hashSize + 1, hashSize, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });

    let hash = 0n;
    let bitIndex = 0;
    for (let row = 0; row < hashSize; row++) {
        for (let col = 0; col < hashSize; col++) {
            const left = data[row * (hashSize + 1) + col];
            const right = data[row * (hashSize + 1) + col + 1];
            if (left < right) {
                hash |= (1n << BigInt(bitIndex));
            }
            bitIndex++;
        }
    }
    return hash.toString(16).padStart(16, '0');
}

/**
 * Compute Hamming distance between two hex-encoded dHash strings.
 * Lower values mean images are more similar.
 * @returns Number of differing bits (0 = identical, 64 = completely different)
 */
export function hammingDistance(hex1: string, hex2: string): number {
    const h1 = BigInt('0x' + hex1);
    const h2 = BigInt('0x' + hex2);
    let xor = h1 ^ h2;
    let count = 0;
    while (xor) {
        count += Number(xor & 1n);
        xor >>= 1n;
    }
    return count;
}

/**
 * Default similarity threshold for dedup matching.
 * 0-64 scale. Lower = more strict (must be more similar).
 * 8 is a good default for AI-generated images.
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 8;
