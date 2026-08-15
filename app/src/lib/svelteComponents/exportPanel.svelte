<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let imageId: string | undefined;
    export let hasCaption: boolean = false;

    const dispatch = createEventDispatcher();

    let isExporting: boolean = false;
    let statusMessage: string = '';

    async function exportSingle() {
        if (!imageId || isExporting) return;

        isExporting = true;
        statusMessage = 'Preparing export...';

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageIds: [imageId],
                    includeWithoutCaptions: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }

            const blob = await response.blob();
            const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.zip';

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            statusMessage = 'Downloaded ✓';
            dispatch('exported', { imageIds: [imageId] });
        } catch (error) {
            console.error('Export error:', error);
            statusMessage = `Error: ${error instanceof Error ? error.message : 'Export failed'}`;
        } finally {
            setTimeout(() => { statusMessage = ''; }, isExporting ? 0 : undefined);
            isExporting = false;
        }
    }
</script>

<div class="export-panel">
    <div class="header">
        <h3>Dataset Export</h3>
    </div>

    <div class="export-info">
        <p>Export this image with its training caption as a <code>.txt</code> file.</p>
        {#if !hasCaption}
            <p class="no-caption-warning">⚠ No training caption set. Add a caption above first, or export without one.</p>
        {/if}
    </div>

    <button
        class="export-button"
        on:click={exportSingle}
        disabled={isExporting}
    >
        {#if isExporting}
            <span class="spinner"></span>
            Exporting...
        {:else}
            ⬇ Download as Dataset
        {/if}
    </button>

    {#if statusMessage}
        <div class="status" class:success={statusMessage.includes('✓')} class:error={statusMessage.includes('Error')}>
            {statusMessage}
        </div>
    {/if}
</div>

<style>
    .export-panel {
        background-color: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
    }

    .header {
        margin-bottom: 8px;
    }

    .header h3 {
        margin: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        color: var(--text-primary, #345D7E);
    }

    .export-info {
        margin-bottom: 12px;
    }

    .export-info p {
        margin: 4px 0;
        font-size: 0.85rem;
        color: var(--text-muted, #5b5b5b);
    }

    .export-info code {
        background-color: var(--bg-input, #f7d1d7);
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 0.8rem;
    }

    .no-caption-warning {
        color: #856404 !important;
        font-size: 0.8rem !important;
    }

    .export-button {
        width: 100%;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        background-color: var(--button-bg, #8dd4b8);
        color: var(--button-text, #fff);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .export-button:hover:not(:disabled) {
        opacity: 0.9;
    }

    .export-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: var(--button-text, #fff);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .status {
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        text-align: center;
    }

    .status.success {
        background-color: #d4edda;
        color: #155724;
    }

    .status.error {
        background-color: #f8d7da;
        color: #721c24;
    }
</style>
