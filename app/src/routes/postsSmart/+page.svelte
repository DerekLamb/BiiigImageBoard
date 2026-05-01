<script lang="ts">
import { holdClick } from "$lib/actions/holdClick";
import { improvImageSize, imageCount } from "$lib/stores/searchStore";
import PageNav from "$lib/pageNav.svelte";
import Image from "$lib/image.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";
import ConfirmationModal from "$lib/svelteComponents/confirmationModal.svelte";
import GroupSelectDropdown from "$lib/svelteComponents/groupSelectDropdown.svelte";
import { page } from "$app/stores";
import { goto } from "$app/navigation";
import { get } from "svelte/store";

/** @type {import('./$types').PageData} */ 

export let data;

let baseUrl: string = "/posts";
const sizes = [ 110, 150, 200, 300, 350];
const numImages = [24, 32, 48, 60, 72, 84, 96];

let showSelect = false;
let selectedImages = new Set<string>();
let selectedImageIds: string[] = [];

// Reactive selection state for template binding
$: selectionMap = new Map(selectedImages.entries());

// Batch operation state
let showBatchMenu = false;
let batchMenuPosition = { x: 0, y: 0 };
let showDeleteConfirm = false;
let showGroupSelect = false;
let selectedGroupId: string | null = null;

// Group creation state
let newGroupName = "";

const imageCountChange = () => {
    const numOfImages = (data.pagination.currentPage - 1) * data.pagination.itemsPerPage;
    const newPage = Math.floor(numOfImages / $imageCount) + 1

    const url = new URL($page.url)
    url.searchParams.set("page", newPage.toString())
    url.searchParams.set("len", $imageCount.toString())
    console.log(url);
    goto(url)
}

const toggleSelectMode = () => {
    showSelect = !showSelect;
    if (!showSelect) {
        selectedImages.clear();
        selectedImages = new Set(); // Reassign to trigger reactivity
        selectedImageIds = [];
    }
}

const toggleImageSelection = (imageId: string) => {
    if (showSelect) {
        if (selectedImages.has(imageId)) {
            selectedImages.delete(imageId);
        } else {
            selectedImages.add(imageId);
        }
        // Reassign Set to trigger Svelte reactivity
        selectedImages = new Set(selectedImages);
        selectedImageIds = Array.from(selectedImages);
    }
}

const toggleAllSelection = () => {
    if (showSelect) {
        if (selectedImages.size === data.images.length) {
            selectedImages.clear();
        } else {
            selectedImages.clear();
            data.images.forEach((image: any) => {
                selectedImages.add(image._id.toString());
            });
        }
        // Reassign Set to trigger Svelte reactivity
        selectedImages = new Set(selectedImages);
        selectedImageIds = Array.from(selectedImages);
    }
}

const toggleBatchMenu = (event: MouseEvent) => {
    if (showSelect && selectedImages.size > 0) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        batchMenuPosition = { x: rect.left, y: rect.bottom };
        showBatchMenu = true;
    }
}

const closeBatchMenu = () => {
    showBatchMenu = false;
}

const handleBatchOperation = async (operation: 'favorite' | 'delete' | 'groupNew' | 'groupAdd') => {
    closeBatchMenu();
    
    if (selectedImageIds.length === 0) return;

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                imageIds: selectedImageIds,
                groupName: operation === 'groupNew' ? newGroupName : undefined,
                groupId: operation === 'groupAdd' ? selectedGroupId : undefined
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(result.message);
            // Refresh the page data
            const url = new URL($page.url);
            goto(url);
        } else {
            console.error(result.message || 'Operation failed');
        }
    } catch (err) {
        console.error('Batch operation error:', err);
    }
}

const handleDeleteConfirm = () => {
    handleBatchOperation('delete');
}

const handleGroupSelect = (groupId: string) => {
    selectedGroupId = groupId;
    handleBatchOperation('groupAdd');
}

const handleGroupCreate = () => {
    if (newGroupName.trim()) {
        handleBatchOperation('groupNew');
        newGroupName = "";
    }
}

const isSelected = (imageId: string) => selectedImages.has(imageId);

// Helper for reactive class binding
$: getSelectionClass = (imageId: string) => selectedImages.has(imageId) ? 'selected' : '';

</script>

<div class="midContainer">
    <SideBar>
        <SearchBar />
        <TagSection imageTags={[]} editable={false}/>
    </SideBar>
    <div class="imageBrowser">
        <PageNav currentPage={data.pagination.currentPage} totalPages = {data.pagination.pageCount} baseUrl = {baseUrl} length = {$imageCount}/>
        <span> Size:
            <select bind:value={$improvImageSize} >
                {#each sizes as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </span>
        <span> Length:
            <select bind:value={$imageCount} on:change={imageCountChange} >
                {#each numImages as num}
                    <option value={num}>{num}</option>
                {/each}
            </select>
        </span>
        
        {#if showSelect}
            <div class="selection-info">
                <span>{selectedImages.size} selected</span>
                <button class="select-all-btn" on:click={toggleAllSelection}>Select All</button>
                <button class="batch-toggle-btn" on:click={toggleBatchMenu}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    Actions
                </button>
            </div>
        {/if}
        
        <div class="imageGrid" style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)" use:holdClick={{onHold: () => toggleSelectMode()}}>
        {#if data.images}
            {#each data.images as image}
                {#if image.thumbnailPath}
                    <div class="imageBox {getSelectionClass(image._id.toString())}">
                        <Image src = "/{image.thumbnailPath}"
                        mainLink = "/posts/{image.uploadDate}"
                        thumbnail={true}
                        selectMode={showSelect}
                        on:click={(e) => {
                            if (showSelect) {
                                e.stopPropagation();
                                toggleImageSelection(image._id.toString());
                            }
                        }}></Image>
                        {#if getSelectionClass(image._id.toString()) === 'selected'}
                            <div class="selection-indicator">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M7 12l2 2 6-6"/>
                                </svg>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="imageBox {getSelectionClass(image._id.toString())}">
                        <Image src = "/{image.imagePath}"
                        mainLink = "/posts/{image.uploadDate}"
                        selectMode={showSelect}
                        on:click={(e) => {
                            if (showSelect) {
                                e.stopPropagation();
                                toggleImageSelection(image._id.toString());
                            }
                        }}></Image>
                        {#if getSelectionClass(image._id.toString()) === 'selected'}
                            <div class="selection-indicator">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M7 12l2 2 6-6"/>
                                </svg>
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        {/if}
        </div>
        
        {#if showBatchMenu}
            <div class="batch-menu" style="left: {batchMenuPosition.x}px; top: {batchMenuPosition.y}px;">
                <button class="batch-btn favorite-btn" on:click={() => handleBatchOperation('favorite')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    Favorite
                </button>
                <button class="batch-btn delete-btn" on:click={() => showDeleteConfirm = true}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete
                </button>
                <button class="batch-btn group-btn" on:click={() => showGroupSelect = true}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                    Group
                </button>
            </div>
        {/if}
        
        <PageNav currentPage={data.pagination.currentPage} totalPages = {data.pagination.pageCount} baseUrl = {baseUrl}/>
    </div>
    <div class="footerSpacer"></div>
</div>

<!-- Confirmation Modal -->
<ConfirmationModal 
    show={showDeleteConfirm}
    title="Delete Images"
    message={`Are you sure you want to delete ${selectedImageIds.length} image(s)? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
    danger={true}
    on:confirm={handleDeleteConfirm}
    on:cancel={() => showDeleteConfirm = false}
/>

<!-- Group Select Dropdown -->
<GroupSelectDropdown 
    show={showGroupSelect}
    selectedGroupId={selectedGroupId}
    onSelect={handleGroupSelect}
/>

<style>
    .midContainer{
        display:flex;
        flex-wrap: nowrap;
        height:100%;
        align-self: stretch;
    }

    .footerSpacer{
        height: 30px;
    }
    
    @media (min-width:960px) {
        .imageGrid{
            gap:5px;
        }
    }

    .imageBrowser{
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
        padding: 0px 1rem;
    }
    
    .imageGrid{
        display: grid;
        gap:5px;
        width: 100%;
    }

    .imageBox{
        position: relative;
        width: 100%;
        overflow:hidden;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    
    .imageBox:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .imageBox.selected {
        box-shadow: 0 0 0 3px var(--button-bg, #3b82f6);
    }

    .selection-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }
    
    .selection-indicator svg {
        width: 20px;
        height: 20px;
    }

    .selection-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0.5rem 0;
        padding: 0.5rem;
        background-color: var(--bg-input);
        border-radius: 0.5rem;
    }
    
    .selection-info span {
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        color: var(--text-primary);
    }
    
    .select-all-btn, .batch-toggle-btn {
        padding: 0.25rem 0.75rem;
        background-color: var(--button-bg);
        color: var(--button-text);
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .select-all-btn:hover, .batch-toggle-btn:hover {
        background-color: var(--button-hover);
        color: var(--button-primary);
    }

    .batch-menu {
        position: fixed;
        z-index: 1000;
        background-color: var(--bg-card);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 150px;
    }
    
    .batch-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background-color: var(--bg-input);
        color: var(--text-primary);
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        transition: background-color 0.15s ease;
    }
    
    .batch-btn:hover {
        background-color: var(--bg-accent);
        color: var(--text-primary);
    }
    
    .batch-btn.favorite-btn:hover {
        background-color: #ffd700;
        color: #333;
    }
    
    .batch-btn.delete-btn:hover {
        background-color: #ff4444;
        color: #fff;
    }
    
    .batch-btn.group-btn:hover {
        background-color: #4CAF50;
        color: #fff;
    }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #5b5b5b;
    }

    select {
        font-family: 'Montserrat', sans-serif;
        font-size: 17px;
        appearance: none;
        color: #345D7E;
        background-color: #f7d1d7;
        border:none;
        border-radius: 7px;
    }
</style>