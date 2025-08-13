


export interface FileOperationResult<T=any> {
    success:boolean;
    message?: string;
    data?: T;
}