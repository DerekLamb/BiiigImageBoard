<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    export let imageId: string = '';

    const dispatch = createEventDispatcher();

    let connected: boolean = false;
    let isProcessing: boolean = false;
    let currentOperation: string = '';
    let statusMessage: string = '';
    let resultImageId: string | undefined;

    const operations = [
        { id: 'watermark_removal', label: 'Remove Watermark', icon: '🧹', description: 'Remove watermarks and text overlays' },
        { id: 'img2img_cleanup', label: 'Detail Cleanup', icon: '✨', description: 'Fix eyes, faces, and artifacts' },
        { id: 'upscale', label: 'Upscale', icon: '🔍', description: 'Increase image resolution' },
        { id: 'full_pipeline', label: 'Full Pipeline', icon: '🚀', description: 'Watermark + Cleanup + Upscale' },
    ];

    async function checkConnection() {
        try {
            const response = await fetch('/api/comfy');
            if (response.ok) {
                const data = await response.json();
                connected = data.data?.connected || false;
            }
        } catch (error) {
            console.error('Failed to check ComfyUI connection:', error);
            connected = false;
        }
    }

    async function runCleanup(operationId: string) {
        if (!imageId || isProcessing || !connected) return;

        isProcessing = true;
        currentOperation = operationId;
        statusMessage = 'Starting cleanup...';
        resultImageId = undefined;

        try {
            const response = await fetch('/api/comfy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageIds: [imageId],
                    operation: operationId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const result = data.data.results[0];
                if (result.success && result.resultImageId) {
                    statusMessage = 'Cleanup completed successfully!';
                    resultImageId = result.resultImageId;
                    dispatch('cleanupComplete', { originalImageId: imageId, resultImageId });
                } else {
                    statusMessage = `Cleanup failed: ${result.error || 'Unknown error'}`;
                }
            } else {
                statusMessage = `Error: ${data.error}`;
            }
        } catch (error) {
            console.error('Cleanup error:', error);
            statusMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        } finally {
            isProcessing = false;
            currentOperation = '';
        }
    }

    function getOperationLabel(opId: string): string {
        return operations.find(o => o.id === opId)?.label || opId;
    }

    onMount(() => {
        checkConnection();
    });
</script>

<div class="cleanup-controls">
    <div class="header">
        <h3>ComfyUI Cleanup</h3>
        <div class="connection-status" class:connected class:disconnected={!connected}>
            {connected ? '● Connected' : '○ Disconnected'}
        </div>
    </div>

    {#if !connected}
        <div class="warning">
            ComfyUI is not reachable. Make sure it's running and configured correctly.
        </div>
    {/if}

    <div class="operations-grid">
        {#each operations as op}
            <button
                class="op-button"
                on:click={() => runCleanup(op.id)}
                disabled={!connected || isProcessing}
                title={op.description}
            >
                <span class="icon">{op.icon}</span>
                <span class="label">{op.label}</span>
            </button>
        {/each}
    </div>

    {#if isProcessing}
        <div class="processing-status">
            <div class="spinner"></div>
            <span>Processing: {getOperationLabel(currentOperation)}...</span>
        </div>
    {/if}

    {#if statusMessage && !isProcessing}
        <div class="status-message" class:success={statusMessage.includes('completed')} class:error={statusMessage.includes('failed') || statusMessage.includes('Error')}>
            {statusMessage}
        </div>
    {/if}

    {#if resultImageId}
        <div class="result-link">
            <a href="/posts/{resultImageId}" target="_blank">
                View Cleaned Result →
            </a>
        </div>
    {/if}
</div>

<style>
    .cleanup-controls {
        background-color: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .header h3 {
        margin: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        color: var(--text-primary, #345D7E);
    }

    .connection-status {
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 12px;
    }

    .connection-status.connected {
        background-color: #d4edda;
        color: #155724;
    }

    .connection-status.disconnected {
        background-color: #f8d7da;
        color: #721c24;
    }

    .warning {
        background-color: #fff3cd;
        color: #856404;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        margin-bottom: 12px;
    }

    .operations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
    }

    .op-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 8px;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        background-color: var(--bg-input, #f7d1d7);
        color: var(--text-primary, #345D7E);
        cursor: pointer;
        transition: all 0.2s;
    }

    .op-button:hover:not(:disabled) {
        background-color: var(--border-color, #e0e0e0);
        transform: translateY(-1px);
    }

    .op-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .op-button .icon {
        font-size: 1.5rem;
    }

    .op-button .label {
        font-size: 0.8rem;
        font-family: 'Montserrat', sans-serif;
    }

    .processing-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        margin-top: 12px;
        background-color: var(--bg-input, #f7d1d7);
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color, #e0e0e0);
        border-top-color: var(--text-accent, #7BAFD4);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .status-message {
        padding: 8px 12px;
        margin-top: 12px;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .status-message.success {
        background-color: #d4edda;
        color: #155724;
    }

    .status-message.error {
        background-color: #f8d7da;
        color: #721c24;
    }

    .result-link {
        margin-top: 12px;
    }

    .result-link a {
        color: var(--text-accent, #7BAFD4);
        text-decoration: none;
        font-size: 0.85rem;
    }

    .result-link a:hover {
        text-decoration: underline;
    }
</style>
