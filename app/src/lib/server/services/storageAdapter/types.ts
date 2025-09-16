export interface storageAdapter {
    readFile(path: string): Promise<Buffer>
    writeFile(path: string, arg2: Buffer): Promise<void>
    deleteFile(path: string): Promise<void>
    listFiles(path: string): Promise<string[]>
}