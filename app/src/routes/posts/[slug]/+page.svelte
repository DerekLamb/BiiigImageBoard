<script lang=ts>
import Image from "$lib/image.svelte";
import Video from "$lib/video.svelte"
import ContentNav from "$lib/contentNav.svelte";
import Tag from "$lib/tag.svelte";
import AutoTagInput from "$lib/autoTagInput.svelte";
import Modal from "$lib/svelteComponents/modal.svelte";
import TrainingCaptionEditor from "$lib/svelteComponents/trainingCaptionEditor.svelte";
import CleanupControls from "$lib/svelteComponents/cleanupControls.svelte";
import ExportPanel from "$lib/svelteComponents/exportPanel.svelte";
import promptDecode from '$lib/ExtractPrompt';
import { onMount } from 'svelte';
import type { EmbeddedPrompt } from '$lib/types/DocTypes';
import type { PageData } from './$types';

export let data: PageData;
$: tags = [...new Set(data.image?.tags ?? [])];
$: embPrompt = data.image?.embPrompt;

let showRawPrompt = false;

// Tag editing (inline row — previously lived in the desktop-only sidebar)
let tagEditing = false;
let autoTags: string[] = [];
let tagError = '';

// Prompt extraction state
let extractionResult: EmbeddedPrompt | null = null;
let isExtractionModalOpen = false;
let isProcessing = false;
let extractionMessage = '';
let modalMessage = '';

onMount(async () => {
    try {
        const res = await fetch('/api/tags');
        if (res.ok) autoTags = await res.json();
    } catch { /* autocomplete is optional */ }
});

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
}

function copyPositive() {
    if (embPrompt?.positive) {
        copyToClipboard(embPrompt.positive.join(", "));
    }
}

function copyNegative() {
    if (embPrompt?.negative) {
        copyToClipboard(embPrompt.negative.join(", "));
    }
}

function copyAll() {
    if (embPrompt) {
        const parts = [];
        if (embPrompt.positive.length > 0) parts.push(embPrompt.positive.join(", "));
        if (embPrompt.negative.length > 0) parts.push("Negative: " + embPrompt.negative.join(", "));
        copyToClipboard(parts.join("\n\n"));
    }
}

function toggleRawPrompt() {
    showRawPrompt = !showRawPrompt;
}

function addTag(raw: string) {
    const clean = (raw || '').toLowerCase().trim().replace(/\s+/g, '_');
    if (!clean || tags.includes(clean)) return;
    tags = [...tags, clean];
    saveTags();
}

function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
    saveTags();
}

async function saveTags() {
    if (!data.image?._id) return;
    tagError = '';
    try {
        const res = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags, imageID: data.image._id })
        });
        if (!res.ok) throw new Error('save failed');
    } catch {
        tagError = 'Failed to save tags.';
    }
}

async function decodePrompt() {
    isProcessing = true;
    extractionMessage = '';
    try {
        let imgBuffer = await fetch(`/${data.image?.imagePath}`);
        const extracted = promptDecode(await imgBuffer.arrayBuffer());
        if (extracted) {
            extractionResult = extracted;
            isExtractionModalOpen = true;
        } else {
            extractionMessage = 'No embedded prompt data found in this image.';
        }
    } catch (error) {
        console.error('Extraction error:', error);
        extractionMessage = 'Failed to extract prompt data.';
    } finally {
        isProcessing = false;
    }
}

async function saveExtraction() {
    if (!extractionResult || !data.image?._id) return;

    isProcessing = true;
    modalMessage = '';
    try {
        const response = await fetch('/api/extraction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageId: data.image._id,
                embPrompt: extractionResult
            })
        });

        const result = await response.json();
        if (result.success) {
            window.location.reload();
        } else {
            modalMessage = `Failed to save: ${result.error}`;
        }
    } catch (error) {
        console.error('Save error:', error);
        modalMessage = 'Failed to save extraction results.';
    } finally {
        isProcessing = false;
    }
}

function cancelExtraction() {
    extractionResult = null;
    isExtractionModalOpen = false;
    modalMessage = '';
}

function confirmDelete(e: Event) {
    if (!confirm('Delete this image? This cannot be undone.')) {
        e.preventDefault();
    }
}

function getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
        'a1111': 'Automatic1111 / Stable Diffusion WebUI',
        'civitai': 'CivitAI',
        'comfyui': 'ComfyUI',
        'sui': 'Stable Diffusion.cpp',
        'unknown': 'Unknown Format'
    };
    return labels[source] || source;
}

function getSourceColor(source: string): string {
    const colors: Record<string, string> = {
        'a1111': '#4a90d9',
        'civitai': '#36b3a0',
        'comfyui': '#9b59b6',
        'sui': '#2e8b57',
        'unknown': '#7f8c8d'
    };
    return colors[source] || '#7f8c8d';
}
</script>

{#if data.image}
<div class="postPage">

    <div class="postHeader">
        <a href="/posts" class="backLink">← Posts</a>
        <span class="postName">{data.image.originalName}</span>
    </div>

    <div class="imageWindow">
        {#if data.image.type == "video"}
            {#key data.image.imagePath}
            <Video src="/{data.image.imagePath}"></Video>
            {/key}
        {:else}
            <Image src="/{data.image.imagePath}"
            leftLink={data.adjacents?.prev?.uploadDate}
            rightLink={data.adjacents?.next?.uploadDate}>
            </Image>
        {/if}
    </div>

    <ContentNav baseUrl="/posts/" contentName={data.image.originalName} prevId={data.adjacents?.prev?.uploadDate} nextId={data.adjacents?.next?.uploadDate} />

    <!-- Inline tags (works on both desktop and mobile) -->
    <div class="tagRow">
        {#each tags as tag (tag)}
            <Tag tag={tag} edit={tagEditing} onDelete={(t: string) => removeTag(t)} />
        {/each}
        {#if tagEditing}
            <div class="tagAddInput">
                <AutoTagInput autocompleteTags={autoTags} on:tag={(e) => addTag((e as CustomEvent<{ tag: string }>).detail.tag)} />
            </div>
        {/if}
        <button class="tagToggle" on:click={() => { tagEditing = !tagEditing; }}>
            {tagEditing ? 'Done' : tags.length > 0 ? 'Edit tags' : 'Add tag'}
        </button>
    </div>
    {#if tagError}
        <div class="formError">{tagError}</div>
    {/if}

    <!-- Prompt Information Panel -->
    {#if embPrompt && (embPrompt.positive.length > 0 || embPrompt.negative.length > 0 || embPrompt.metadata.length > 0)}
        <div class="promptPanel">
            <div class="promptHeader">
                <h3>Generation Prompt</h3>
                <span class="sourceBadge" style="background-color: {getSourceColor(embPrompt.source)}">
                    {getSourceLabel(embPrompt.source)}
                </span>
            </div>

            {#if embPrompt.positive.length > 0}
                <div class="promptSection">
                    <div class="sectionHeader">
                        <h4>Positive Prompt</h4>
                        <button class="copyBtn" on:click={copyPositive} title="Copy positive prompt">Copy</button>
                    </div>
                    <div class="promptTags">
                        {#each embPrompt.positive as tag, i (i)}
                            <span class="tag positive">{tag}</span>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if embPrompt.negative.length > 0}
                <div class="promptSection">
                    <div class="sectionHeader">
                        <h4>Negative Prompt</h4>
                        <button class="copyBtn" on:click={copyNegative} title="Copy negative prompt">Copy</button>
                    </div>
                    <div class="promptTags">
                        {#each embPrompt.negative as tag, i (i)}
                            <span class="tag negative">{tag}</span>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if embPrompt.metadata.length > 0}
                <div class="promptSection metadata">
                    <div class="sectionHeader">
                        <h4>Generation Settings</h4>
                    </div>
                    <div class="metadataGrid">
                        {#each embPrompt.metadata as meta, i (i)}
                            {@const [key, ...valueParts] = meta.split(':')}
                            {@const value = valueParts.join(':').trim()}
                            <div class="metaItem">
                                <span class="metaKey">{key}</span>
                                <span class="metaValue">{value}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="promptActions">
                <button class="actionBtn" on:click={copyAll}>Copy All Prompts</button>
                {#if embPrompt.raw}
                    <button class="actionBtn secondary" on:click={toggleRawPrompt}>
                        {showRawPrompt ? 'Hide Raw Data' : 'Show Raw Data'}
                    </button>
                {/if}
            </div>

            {#if showRawPrompt && embPrompt.raw}
                <div class="rawPrompt">
                    <pre>{embPrompt.raw}</pre>
                </div>
            {/if}
        </div>
    {:else if data.image.type !== 'video'}
        <div class="promptEmpty">
            <span>No embedded prompt data in this image.</span>
            <button class="linkBtn" on:click={decodePrompt} disabled={isProcessing}>
                {isProcessing ? 'Extracting…' : 'Attempt extraction'}
            </button>
            {#if extractionMessage}
                <span class="inlineError">{extractionMessage}</span>
            {/if}
        </div>
    {/if}

    <!-- Delete: just under the prompt card, with a confirm guard -->
    <div class="deleteRow">
        <form method="post" action="?/delete" class="deleteForm"
            on:submit={(e) => confirmDelete(e)}>
            <button type="submit" class="deleteBtn">Delete image</button>
            <input type="hidden" name="strId" value={data.image?._id}>
            {#if data.adjacents?.next != null}
            <input type="hidden" name="next" value="{data.adjacents.next.uploadDate}">
            {/if}
            {#if data.adjacents?.prev != null}
            <input type="hidden" name="prev" value="{data.adjacents.prev.uploadDate}">
            {/if}
        </form>
    </div>
    <TrainingCaptionEditor
        imageId={data.image?._id}
        embPromptPositive={embPrompt?.positive ?? []}
        editable={true}
    />

    <!-- ComfyUI Cleanup Controls -->
    <CleanupControls imageId={data.image?._id} />

    <!-- Export Panel -->
    <ExportPanel
        imageId={data.image?._id}
        hasCaption={!!data.image?.trainingPrompt}
    />

    <!-- File footer: compact meta line -->
    <footer class="fileFooter">
        <div class="fileMeta">
            <span class="mono">{data.image.sanitizedFilename}</span>
            <span class="metaDot">·</span>
            <span class="mono">{data.image._id}</span>
            <span class="metaDot">·</span>
            <span>{data.image.imagePath}</span>
        </div>
    </footer>

    <!-- Extraction Results Modal -->
    {#if isExtractionModalOpen && extractionResult}
        <Modal show={isExtractionModalOpen}>
            <h3 slot="header">Extraction Results</h3>
            <div class="extractionPreview">
                <div class="extractionSource">
                    <span class="sourceBadge" style="background-color: {getSourceColor(extractionResult.source)}">
                        {getSourceLabel(extractionResult.source)}
                    </span>
                </div>

                {#if extractionResult.positive.length > 0}
                    <div class="extractionSection">
                        <h4>Positive Prompt</h4>
                        <div class="promptTags">
                            {#each extractionResult.positive as tag, i (i)}
                                <span class="tag positive">{tag}</span>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if extractionResult.negative.length > 0}
                    <div class="extractionSection">
                        <h4>Negative Prompt</h4>
                        <div class="promptTags">
                            {#each extractionResult.negative as tag, i (i)}
                                <span class="tag negative">{tag}</span>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if extractionResult.metadata.length > 0}
                    <div class="extractionSection metadata">
                        <h4>Generation Settings</h4>
                        <div class="metadataGrid">
                            {#each extractionResult.metadata as meta, i (i)}
                                {@const [key, ...valueParts] = meta.split(':')}
                                {@const value = valueParts.join(':').trim()}
                                <div class="metaItem">
                                    <span class="metaKey">{key}</span>
                                    <span class="metaValue">{value}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if extractionResult.raw}
                    <div class="rawPrompt">
                        <h4>Raw Data</h4>
                        <pre>{extractionResult.raw}</pre>
                    </div>
                {/if}

                {#if modalMessage}
                    <div class="formError">{modalMessage}</div>
                {/if}

                <div class="extractionActions">
                    <button class="actionBtn" on:click={saveExtraction} disabled={isProcessing}>
                        {isProcessing ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button class="actionBtn secondary" on:click={cancelExtraction} disabled={isProcessing}>
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    {/if}
</div>

{:else}
<div class="notFound">
    <h2>Image not found</h2>
    <p>This post doesn't exist or was deleted.</p>
    <a class="backLink" href="/posts">← Back to posts</a>
</div>
{/if}

<style>
    .postPage {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 40px;
        font-family: 'Montserrat', sans-serif;
        color: var(--text-primary);
    }

    .postPage h3,
    .postPage h4 {
        font-family: 'Montserrat', sans-serif;
    }

    .postHeader {
        display: flex;
        align-items: baseline;
        gap: 12px;
    }

    .backLink {
        color: var(--text-accent, var(--text-secondary));
        text-decoration: none;
        font-size: 0.9rem;
        white-space: nowrap;
    }

    .backLink:hover {
        text-decoration: underline;
    }

    .postName {
        color: var(--text-secondary);
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .imageWindow {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
    }

    /* Inline tag row */
    .tagRow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-height: 32px;
    }

    .tagAddInput {
        width: 160px;
    }

    .tagToggle {
        font-size: 0.8rem;
        font-family: inherit;
        color: var(--text-primary);
        background: color-mix(in srgb, var(--text-secondary) 18%, transparent);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        padding: 4px 12px;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .tagToggle:hover {
        opacity: 0.8;
    }

    .formError {
        color: #721c24;
        background-color: #f8d7da;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.85rem;
    }

    .deleteRow {
        display: flex;
        margin-top: -4px;
    }

    .inlineError {
        color: #721c24;
        font-size: 0.85rem;
    }

    /* Prompt Panel Styles */
    .promptPanel {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .promptEmpty {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 14px 20px;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .linkBtn {
        font-size: 0.85rem;
        font-family: inherit;
        color: var(--text-primary);
        background: none;
        border: none;
        text-decoration: underline;
        cursor: pointer;
        padding: 0;
    }

    .linkBtn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .promptHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .promptHeader h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.2rem;
    }

    .sourceBadge {
        padding: 4px 12px;
        border-radius: 20px;
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .promptSection {
        margin-bottom: 16px;
    }

    .sectionHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
    }

    .sectionHeader h4 {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .copyBtn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.8rem;
        font-family: inherit;
        color: var(--text-secondary);
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .copyBtn:hover {
        opacity: 1;
    }

    .promptTags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .tag {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .tag.positive {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .tag.negative {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .metadata {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
    }

    .metadataGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 8px;
    }

    .metaItem {
        display: flex;
        gap: 8px;
        font-size: 0.85rem;
    }

    .metaKey {
        color: var(--text-secondary);
        font-weight: 500;
    }

    .metaKey::after {
        content: ':';
    }

    .metaValue {
        color: var(--text-primary);
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .promptActions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
    }

    .actionBtn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 500;
        background-color: var(--button-primary);
        color: #fff;
        transition: opacity 0.2s;
    }

    .actionBtn:hover:not(:disabled) {
        opacity: 0.88;
    }

    .actionBtn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .actionBtn.secondary {
        background-color: color-mix(in srgb, var(--text-secondary) 22%, var(--bg-secondary));
        color: var(--text-primary);
    }

    .actionBtn.secondary:hover:not(:disabled) {
        opacity: 0.85;
    }

    .rawPrompt {
        margin-top: 16px;
        padding: 12px;
        background-color: #1e242c;
        border-radius: 8px;
        overflow-x: auto;
    }

    .rawPrompt pre {
        margin: 0;
        color: #f8f9fa;
        font-size: 0.75rem;
        white-space: pre-wrap;
        word-break: break-all;
    }

    /* File footer: compact meta line + delete, kept at the very bottom */
    .fileFooter {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
    }

    .fileMeta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: var(--text-secondary);
        min-width: 0;
    }

    .fileMeta .mono {
        font-family: monospace;
        font-size: 0.75rem;
    }

    .metaDot {
        opacity: 0.5;
    }

    .deleteBtn {
        padding: 6px 14px;
        background: none;
        color: #dc3545;
        border: 1px solid #dc3545;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.8rem;
        transition: background-color 0.2s, color 0.2s;
    }

    .deleteBtn:hover {
        background-color: #dc3545;
        color: white;
    }

    /* Extraction Modal Preview Styles */
    .extractionPreview {
        max-height: 70vh;
        overflow-y: auto;
    }

    .extractionSource {
        margin-bottom: 16px;
        text-align: right;
    }

    .extractionSection {
        margin-bottom: 16px;
    }

    .extractionSection h4 {
        margin: 0 0 8px 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .extractionActions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
    }

    /* 404 state */
    .notFound {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 80px 20px;
        text-align: center;
        font-family: 'Montserrat', sans-serif;
        color: var(--text-primary);
    }

    .notFound h2 {
        margin: 0;
        font-size: 1.4rem;
    }

    .notFound p {
        margin: 0;
        color: var(--text-secondary);
    }
</style>
