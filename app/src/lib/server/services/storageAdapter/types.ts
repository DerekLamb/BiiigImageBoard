import type { FileOperationResult } from "$lib/types/services"

export interface storageAdapter {
    readFile(path: string): Promise<Buffer>
    writeFile(path: string, data: Uint8Array): Promise<FileOperationResult>
    deleteFile(path: string): Promise<FileOperationResult>
    listFiles(path: string): Promise<string[]>
}