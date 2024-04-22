import fs from 'fs/promises';


export const FileModel = {
    async readDir(path: string): Promise<string[]> {
        try {
            return await fs.readdir(path);
        } catch (error) {
            throw new Error(`Error reading directory: ${error}`);
        }
    },

    async read(path: string): Promise<Buffer> {
        try {
            return await fs.readFile(path);
        } catch (error) {
            throw new Error(`Error reading file: ${error}`);
        }
    },

    async write(path: string, data: Buffer): Promise<void> {
        try {
            await fs.writeFile(path, data);
        } catch (error) {
            throw new Error(`Error writing file: ${error}`);
        }
    },

    async delete(path: string): Promise<void> {
        try {
            await fs.unlink(path);
        } catch (error) {
            throw new Error(`Error deleting file: ${error}`);
        }
    },

    async checkExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch (error) {
            return false;
        }
    }

}