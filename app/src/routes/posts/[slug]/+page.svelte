<script lang=ts>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import Image from "$lib/image.svelte";
import Video from "$lib/video.svelte"
import ContentNav from "$lib/contentNav.svelte";
import ReturnButton from '$lib/returnButton.svelte';
import promptDecode from '$lib/ExtractPrompt';
import type { EmbeddedPrompt } from '$lib/types/DocTypes';
import type { PageData } from './$types';

export let data: PageData;
let tags = data.image?.tags ?? [];
let embPrompt: EmbeddedPrompt | null | undefined = data.image?.embPrompt;
let imageYScroll = 0;
let showRawPrompt = false;

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

async function decodePrompt() {
    let imgBuffer = await fetch(`/${data.image?.imagePath}`);
    console.log(promptDecode(await imgBuffer.arrayBuffer()));
}

function getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
        'a1111': 'Automatic1111 / Stable Diffusion WebUI',
        'civitai': 'CivitAI',
        'comfyui': 'ComfyUI',
        'unknown': 'Unknown Format'
    };
    return labels[source] || source;
}

function getSourceColor(source: string): string {
    const colors: Record<string, string> = {
        'a1111': '#4a90d9',
        'civitai': '#36b3a0',
        'comfyui': '#9b59b6',
        'unknown': '#7f8c8d'
    };
    return colors[source] || '#7f8c8d';
}
</script>

<svelte:window bind:scrollY={imageYScroll} />

<div class="midContainer">

    <SideBar itemCount={3}>
        <SearchBar></SearchBar>
        <ReturnButton contentId={data.image?._id}/>
        <TagSection editable={true} imageID={data.image?._id} imageTags={tags}></TagSection>

    </SideBar>
    
    <div class="contentArea">
        <div class="imageWindow">
            {#if data.image?.type == "video"}
                {#key data.image?.imagePath}
                <Video src="../../{data.image?.imagePath}"></Video>
                {/key}
            {:else}
                <Image src="../../{data.image?.imagePath}"
                leftLink={data.adjacents?.prev?.uploadDate}
                rightLink={data.adjacents?.next?.uploadDate}>
                </Image>
            {/if}
        </div>

        <ContentNav baseUrl="/posts/" contentName={data.image?.originalName} prevId={data.adjacents?.prev?.uploadDate} nextId={data.adjacents?.next?.uploadDate} />
        <div id="smallVisible">
            <ReturnButton contentId={data.image?._id}/>
        </div>


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
                            <button class="copyBtn" on:click={copyPositive} title="Copy positive prompt">📋</button>
                        </div>
                        <div class="promptTags">
                            {#each embPrompt.positive as tag, i}
                                <span class="tag positive">{tag}{#if i < embPrompt.positive.length - 1}{/if}</span>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if embPrompt.negative.length > 0}
                    <div class="promptSection">
                        <div class="sectionHeader">
                            <h4>Negative Prompt</h4>
                            <button class="copyBtn" on:click={copyNegative} title="Copy negative prompt">📋</button>
                        </div>
                        <div class="promptTags">
                            {#each embPrompt.negative as tag, i}
                                <span class="tag negative">{tag}{#if i < embPrompt.negative.length - 1}{/if}</span>
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
                            {#each embPrompt.metadata as meta}
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
        {:else if data.image?.type !== 'video'}
            <div class="promptPanel empty">
                <p>No embedded prompt data found in this image.</p>
                <button class="actionBtn" on:click={decodePrompt}>Attempt Extraction</button>
            </div>
        {/if}

        <!-- Image Info Panel -->
        <div class="imageInfo">
            <h3>File Information</h3>
            <div class="infoGrid">
                <div class="infoItem">
                    <span class="infoLabel">Original Name</span>
                    <span class="infoValue">{data.image?.originalName}</span>
                </div>
                <div class="infoItem">
                    <span class="infoLabel">Filename</span>
                    <span class="infoValue">{data.image?.sanitizedFilename}</span>
                </div>
                <div class="infoItem">
                    <span class="infoLabel">Location</span>
                    <span class="infoValue">{data.image?.imagePath}</span>
                </div>
                <div class="infoItem">
                    <span class="infoLabel">ID</span>
                    <span class="infoValue mono">{data.image?._id}</span>
                </div>
            </div>

            <form method="post" action="?/delete" class="deleteForm">
                <button type="submit" class="deleteBtn">🗑️ Delete Image</button>
                <input type="hidden" name="strId" value="{data.image?._id}">
                {#if data.adjacents?.next != null}
                <input type="hidden" name="next" value="{data.adjacents.next.uploadDate}">
                {/if}
                {#if data.adjacents?.prev != null}
                <input type="hidden" name="prev" value="{data.adjacents.prev.uploadDate}">
                {/if}
            </form>
        </div>

        <!-- Comments Section (placeholder) -->
        <!-- <div class="commentsSection">
            <h3>Comments</h3>
            <div class="commentPlaceholder">
                <p>Comments coming soon...</p>
            </div>
        </div> -->
    </div>
</div>

<style>
    .midContainer {
        display: grid;
        gap: 60px;
        height: 100%;
        align-self: stretch;
    }

    .contentArea {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 40px;
    }

    @media (min-width: 960px) {
        .midContainer {
            grid-template-columns: 200px 1fr;
        }
        #smallVisible {
            display:none;
        }

    }

    .imageWindow {
        background-color: #9ac7d6;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
    }

    /* Prompt Panel Styles */
    .promptPanel {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .promptPanel.empty {
        text-align: center;
        color: #6c757d;
        padding: 30px;
    }

    .promptHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #dee2e6;
    }

    .promptHeader h3 {
        margin: 0;
        color: #343a40;
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
        color: #495057;
        font-size: 0.9rem;
    }

    .copyBtn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.6;
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
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
    }

    .metadataGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
    }

    .metaItem {
        display: flex;
        gap: 8px;
        font-size: 0.85rem;
    }

    .metaKey {
        color: #6c757d;
        font-weight: 500;
    }

    .metaKey::after {
        content: ':';
    }

    .metaValue {
        color: #343a40;
    }

    .promptActions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #dee2e6;
    }

    .actionBtn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        background-color: #007bff;
        color: white;
        transition: background-color 0.2s;
    }

    .actionBtn:hover {
        background-color: #0056b3;
    }

    .actionBtn.secondary {
        background-color: #6c757d;
    }

    .actionBtn.secondary:hover {
        background-color: #545b62;
    }

    .rawPrompt {
        margin-top: 16px;
        padding: 12px;
        background-color: #343a40;
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

    /* Image Info Styles */
    .imageInfo {
        background-color: #fff;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }

    .imageInfo h3 {
        margin: 0 0 16px 0;
        color: #343a40;
        font-size: 1.1rem;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 8px;
    }

    .infoGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
    }

    .infoItem {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .infoLabel {
        font-size: 0.75rem;
        color: #6c757d;
        text-transform: uppercase;
        font-weight: 600;
    }

    .infoValue {
        font-size: 0.9rem;
        color: #343a40;
    }

    .infoValue.mono {
        font-family: monospace;
        font-size: 0.8rem;
        background-color: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .deleteForm {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e9ecef;
    }

    .deleteBtn {
        padding: 10px 20px;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .deleteBtn:hover {
        background-color: #c82333;
    }
</style>