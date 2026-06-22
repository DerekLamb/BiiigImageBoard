/**
 * ComfyUI Client Service
 * Handles communication with a running ComfyUI instance via its REST API
 * 
 * ComfyUI API Reference:
 * - POST /prompt - Queue a workflow
 * - GET /history?promptId=X - Get execution history
 * - GET /queue - Get current queue status
 * - POST /interrupt - Stop current execution
 * - POST /upload/image - Upload input image
 * - GET /view?filename=X&subfolder=Y&type=input - View output image
 */

interface ComfyPromptResponse {
    prompt_id: string;
    number: number;
    node_errors: Record<string, unknown>;
}

interface ComfyHistoryEntry {
    prompt_id: string;
    outputs: Record<string, {
        images?: Array<{
            filename: string;
            subfolder: string;
            type: string;
        }>;
    }>;
    status?: {
        status_str: string;
        completed: boolean;
        messages: Array<{ title: string; message: string; type: string }>;
    };
}

interface ComfyHistoryResult {
    success: boolean;
    completed: boolean;
    outputImage?: {
        filename: string;
        subfolder: string;
        type: string;
    };
    error?: string;
}

export class ComfyUIClient {
    private serverAddress: string;
    private clientId: string;

    constructor(serverAddress?: string) {
        // Default to localhost:8188, override via env var
        this.serverAddress = serverAddress || process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
        // Remove trailing slash
        if (this.serverAddress.endsWith('/')) {
            this.serverAddress = this.serverAddress.slice(0, -1);
        }
        this.clientId = `bib-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Upload an image to ComfyUI's input directory
     */
    async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
        const formData = new FormData();
        // ComfyUI expects a Blob for the file - cast Buffer to avoid TS strict type issues
        const blob = new Blob([imageBuffer as unknown as BlobPart], { type: 'image/png' });
        formData.append('image', blob, filename);
        formData.append('subfolder', '');
        formData.append('type', 'input');

        const response = await fetch(`${this.serverAddress}/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ComfyUI upload failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return result.name || filename;
    }

    /**
     * Submit a workflow (prompt) to ComfyUI's execution queue
     */
    async queuePrompt(workflow: object): Promise<string> {
        const payload = {
            prompt: workflow,
            client_id: this.clientId,
        };

        const response = await fetch(`${this.serverAddress}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ComfyUI queue failed: ${response.status} ${errorText}`);
        }

        const result: ComfyPromptResponse = await response.json();
        return result.prompt_id;
    }

    /**
     * Poll the history endpoint until the prompt completes or fails
     */
    async waitForCompletion(promptId: string, timeoutMs: number = 300_000, pollIntervalMs: number = 2_000): Promise<ComfyHistoryResult> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const response = await fetch(`${this.serverAddress}/history?promptId=${promptId}`);
                
                if (!response.ok) {
                    throw new Error(`History fetch failed: ${response.status}`);
                }

                const history: Record<string, ComfyHistoryEntry> = await response.json();
                const entry = history[promptId];

                if (!entry) {
                    // Not yet in history, still queued
                    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
                    continue;
                }

                // Check status
                if (entry.status?.status_str === 'error') {
                    const errorMsg = entry.status.messages.map(m => m.message).join('; ');
                    return {
                        success: false,
                        completed: true,
                        error: `ComfyUI execution error: ${errorMsg}`,
                    };
                }

                // Look for output images
                for (const [nodeId, output] of Object.entries(entry.outputs)) {
                    if (output.images && output.images.length > 0) {
                        return {
                            success: true,
                            completed: true,
                            outputImage: output.images[0],
                        };
                    }
                }

                // Completed but no images found
                return {
                    success: true,
                    completed: true,
                };
            } catch (error) {
                console.warn('Error polling ComfyUI history:', error);
                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            }
        }

        return {
            success: false,
            completed: false,
            error: 'ComfyUI execution timed out',
        };
    }

    /**
     * Download an output image from ComfyUI
     */
    async getOutputImage(filename: string, subfolder: string = '', type: string = 'output'): Promise<Buffer> {
        const params = new URLSearchParams({ filename, subfolder, type });
        const response = await fetch(`${this.serverAddress}/view?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to download image from ComfyUI: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Get current queue status
     */
    async getQueueStatus(): Promise<{ executing: Array<{ prompt_id: string }>, queue: Array<string> }> {
        const response = await fetch(`${this.serverAddress}/queue`);
        if (!response.ok) {
            throw new Error(`Failed to get queue status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Interrupt current execution
     */
    async interrupt(): Promise<void> {
        const response = await fetch(`${this.serverAddress}/interrupt`, { method: 'POST' });
        if (!response.ok) {
            throw new Error(`Failed to interrupt ComfyUI: ${response.status}`);
        }
    }

    /**
     * Check if ComfyUI is reachable
     */
    async ping(): Promise<boolean> {
        try {
            const response = await fetch(`${this.serverAddress}/queue`, { method: 'GET' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * High-level: Upload image, run workflow, download result
     * 
     * @param imageBuffer - Input image buffer
     * @param workflowFn - Function that receives the uploaded filename and returns the workflow to execute
     * @param timeoutMs - Maximum time to wait for completion
     */
    async processImage(
        imageBuffer: Buffer,
        workflowFn: (uploadedFilename: string) => object,
        timeoutMs: number = 300_000
    ): Promise<Buffer> {
        // 1. Upload the image
        const ext = this.detectExtension(imageBuffer);
        const filename = `input-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const uploadedName = await this.uploadImage(imageBuffer, filename);

        // 2. Build and submit workflow
        const workflow = workflowFn(uploadedName);
        const promptId = await this.queuePrompt(workflow);

        // 3. Wait for completion
        const result = await this.waitForCompletion(promptId, timeoutMs);

        if (!result.success || !result.outputImage) {
            throw new Error(result.error || 'No output image from ComfyUI');
        }

        // 4. Download the result
        return this.getOutputImage(result.outputImage.filename, result.outputImage.subfolder, result.outputImage.type);
    }

    /**
     * Detect image extension from buffer magic bytes
     */
    private detectExtension(buffer: Buffer): string {
        if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
            return 'jpg';
        }
        if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return 'png';
        }
        if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            return 'gif';
        }
        // Default to png (safest for ComfyUI)
        return 'png';
    }
}

// Singleton instance
let _comfyClient: ComfyUIClient | null = null;

export function getComfyUIClient(): ComfyUIClient {
    if (!_comfyClient) {
        _comfyClient = new ComfyUIClient();
    }
    return _comfyClient;
}
