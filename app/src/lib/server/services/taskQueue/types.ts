/**
 * Task Queue Types
 * Defines types for the background task processing system
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TaskType = 'thumbnail' | 'extract_prompt' | 'video_thumbnail' | 'cleanup';

export interface Task<T = unknown> {
    id: string;
    type: TaskType;
    status: TaskStatus;
    payload: T;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    retries: number;
}

export interface ThumbnailTaskPayload {
    imageId: string;
    imagePath: string;
    overwrite?: boolean;
}

export interface ExtractPromptTaskPayload {
    imageId: string;
    imagePath: string;
}

export interface VideoThumbnailTaskPayload {
    imageId: string;
    imagePath: string;
    overwrite?: boolean;
}

export type CleanupOperation = 'watermark_removal' | 'upscale' | 'img2img_cleanup' | 'full_pipeline';

export interface CleanupTaskPayload {
    imageId: string;
    imagePath: string;
    operation: CleanupOperation;
}

export interface BatchProcessingResult {
    total: number;
    successful: number;
    failed: number;
    errors: Array<{ imageId: string; error: string }>;
}

export interface TaskQueueStats {
    pending: number;
    running: number;
    completed: number;
    failed: number;
}
