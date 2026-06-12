<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    export let imageId: string = '';
    export let embPromptPositive: string[] = [];
    export let editable: boolean = true;

    const dispatch = createEventDispatcher();

    let trainingPrompt: string = '';
    let isLoading: boolean = true;
    let isSaving: boolean = false;
    let saveStatus: 'idle' | 'saved' | 'error' = 'idle';
    let hasUnsavedChanges: boolean = false;

    // Simple CLIP-like token estimation (space-separated words, ~1 token per word)
    function estimateTokens(text: string): number {
        if (!text || text.trim().length === 0) return 0;
        // CLIP tokenizer roughly splits on spaces and punctuation
        const tokens = text.trim().split(/[\s,.;:!?]+/).filter(t => t.length > 0);
        return tokens.length;
    }

    $: tokenCount = estimateTokens(trainingPrompt);
    $: charCount = trainingPrompt.length;
    $: isNearTokenLimit = tokenCount > 60;
    $: isOverTokenLimit = tokenCount > 75;

    async function fetchCaption() {
        if (!imageId) return;
        isLoading = true;
        try {
            const response = await fetch(`/api/captions?imageId=${imageId}`);
            if (response.ok) {
                const data = await response.json();
                trainingPrompt = data.trainingPrompt || '';
                hasUnsavedChanges = false;
            }
        } catch (error) {
            console.error('Error fetching training caption:', error);
        } finally {
            isLoading = false;
        }
    }

    async function saveCaption() {
        if (!imageId || isSaving) return;
        isSaving = true;
        saveStatus = 'idle';
        try {
            const response = await fetch('/api/captions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId, trainingPrompt })
            });

            if (response.ok) {
                saveStatus = 'saved';
                hasUnsavedChanges = false;
                dispatch('saved', { imageId, trainingPrompt });
                setTimeout(() => { saveStatus = 'idle'; }, 2000);
            } else {
                saveStatus = 'error';
            }
        } catch (error) {
            console.error('Error saving training caption:', error);
            saveStatus = 'error';
        } finally {
            isSaving = false;
        }
    }

    function handleInput() {
        hasUnsavedChanges = true;
        saveStatus = 'idle';
    }

    function copyFromEmbeddedPrompt() {
        if (embPromptPositive.length > 0) {
            trainingPrompt = embPromptPositive.join(', ');
            hasUnsavedChanges = true;
            saveStatus = 'idle';
        }
    }

    function clearCaption() {
        trainingPrompt = '';
        hasUnsavedChanges = true;
        saveStatus = 'idle';
    }

    function copyCaption() {
        navigator.clipboard.writeText(trainingPrompt);
    }

    onMount(() => {
        fetchCaption();
    });
</script>

<div class="training-caption-editor">
    <div class="editor-header">
        <h3>Training Caption</h3>
        {#if !editable}
            <span class="read-only-badge">Read Only</span>
        {:else if hasUnsavedChanges}
            <span class="unsaved-badge">Unsaved</span>
        {:else if saveStatus === 'saved'}
            <span class="saved-badge">Saved ✓</span>
        {:else if saveStatus === 'error'}
            <span class="error-badge">Error ✗</span>
        {/if}
    </div>

    {#if isLoading}
        <div class="loading">Loading caption...</div>
    {:else}
        <div class="editor-body">
            <textarea
                class="caption-textarea"
                bind:value={trainingPrompt}
                on:input={handleInput}
                placeholder="Enter training caption for this image..."
                rows={4}
                disabled={!editable}
            ></textarea>

            <div class="editor-footer">
                <div class="stats">
                    <span class="char-count">{charCount} characters</span>
                    <span class="separator">·</span>
                    <span class="token-count" class:warning={isNearTokenLimit} class:error={isOverTokenLimit}>
                        ~{tokenCount} tokens
                        {#if isOverTokenLimit}
                            <span class="limit-warning"> (CLIP limit: ~75)</span>
                        {/if}
                    </span>
                </div>

                {#if editable}
                    <div class="actions">
                        {#if embPromptPositive.length > 0 && !trainingPrompt}
                            <button class="btn-secondary" on:click={copyFromEmbeddedPrompt} title="Copy tags from embedded prompt">
                                From Embedded Prompt
                            </button>
                        {/if}
                        <button class="btn-secondary" on:click={copyCaption} title="Copy caption to clipboard">
                            Copy
                        </button>
                        {#if trainingPrompt}
                            <button class="btn-secondary" on:click={clearCaption} title="Clear caption">
                                Clear
                            </button>
                        {/if}
                        <button
                            class="btn-primary"
                            on:click={saveCaption}
                            disabled={!hasUnsavedChanges || isSaving}
                        >
                            {#if isSaving}Saving...{:else}Save{/if}
                        </button>
                    </div>
                {/if}
            </div>

            {#if trainingPrompt}
                <details class="caption-preview">
                    <summary>Export Preview</summary>
                    <div class="preview-content">
                        <code>{trainingPrompt}</code>
                    </div>
                </details>
            {/if}
        </div>
    {/if}
</div>

<style>
    .training-caption-editor {
        background-color: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .editor-header h3 {
        margin: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        color: var(--text-primary, #345D7E);
    }

    .read-only-badge,
    .unsaved-badge,
    .saved-badge,
    .error-badge {
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 12px;
    }

    .read-only-badge {
        background-color: var(--bg-input, #f0f0f0);
        color: var(--text-muted, #666);
    }

    .unsaved-badge {
        background-color: #fff3cd;
        color: #856404;
    }

    .saved-badge {
        background-color: #d4edda;
        color: #155724;
    }

    .error-badge {
        background-color: #f8d7da;
        color: #721c24;
    }

    .loading {
        color: var(--text-muted, #666);
        text-align: center;
        padding: 16px;
    }

    .caption-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        background-color: var(--bg-input, #f7d1d7);
        color: var(--text-primary, #345D7E);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        resize: vertical;
        min-height: 80px;
    }

    .caption-textarea:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .caption-textarea:focus {
        outline: none;
        border-color: var(--text-accent, #7BAFD4);
        box-shadow: 0 0 0 2px rgba(123, 175, 212, 0.2);
    }

    .editor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        flex-wrap: wrap;
        gap: 8px;
    }

    .stats {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--text-muted, #5b5b5b);
    }

    .separator {
        color: var(--border-color, #ccc);
    }

    .token-count.warning {
        color: #856404;
    }

    .token-count.error {
        color: #721c24;
        font-weight: bold;
    }

    .limit-warning {
        font-size: 0.75rem;
    }

    .actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
        padding: 6px 14px;
        border: none;
        border-radius: 6px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        cursor: pointer;
        transition: opacity 0.2s, background-color 0.2s;
    }

    .btn-primary {
        background-color: var(--button-bg, #8dd4b8);
        color: var(--button-text, #fff);
    }

    .btn-primary:hover:not(:disabled) {
        opacity: 0.9;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: var(--bg-input, #f0f0f0);
        color: var(--text-primary, #345D7E);
    }

    .btn-secondary:hover {
        background-color: var(--border-color, #e0e0e0);
    }

    .caption-preview {
        margin-top: 10px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        padding-top: 8px;
    }

    .caption-preview summary {
        cursor: pointer;
        font-size: 0.85rem;
        color: var(--text-secondary, #678c9e);
    }

    .preview-content {
        margin-top: 6px;
        padding: 8px;
        background-color: var(--bg-input, #f7d1d7);
        border-radius: 4px;
    }

    .preview-content code {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: var(--text-primary, #345D7E);
        word-break: break-word;
    }
</style>
