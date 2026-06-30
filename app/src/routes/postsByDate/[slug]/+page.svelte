<script lang="ts">
    import { improvImageSize, imageCount } from '$lib/stores/searchStore';
    import PageNav from '$lib/pageNav.svelte';
    import TagSection from '$lib/tagSection.svelte';
    import SideBar from '$lib/sideBar.svelte';
    import SearchBar from '$lib/searchBar.svelte';
    import ConfirmationModal from '$lib/svelteComponents/confirmationModal.svelte';
    import GroupSelectDropdown from '$lib/svelteComponents/groupSelectDropdown.svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { AppImage, UploadEvent } from '$lib/types/DocTypes.js';

    /** @type {import('./$types').PageData} */

    export let data;

    let baseUrl = `/postsByDate/${data.event?.startDate || ''}`;
    const sizes = [110, 150, 200, 300, 350];
    const numImages = [24, 32, 48, 60, 72, 84, 96];

    let showSelect = false;
    let selectedImages = new Set<string>();
    let selectedImageIds: string[] = [];

    $: selectionMap = new Map(selectedImages.entries());

    let showBatchMenu = false;
    let batchMenuPosition = { x: 0, y: 0 };
    let showDeleteConfirm = false;
    let showGroupSelect = false;
    let selectedGroupId: string | null = null;
    let newGroupName = '';

    function formatDate(ts) {
        const d = new Date(parseInt(ts));
        return d.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    function formatTime(ts) {
        const d = new Date(parseInt(ts));
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit'
        });
    }

    function formatDuration(startTs, endTs) {
        const diffMs = parseInt(endTs) - parseInt(startTs);
        if (diffMs < 60000) return '< 1 min';
        const mins = Math.round(diffMs / 60000);
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (remainingMins === 0) return `${hours}h`;
        return `${hours}h ${remainingMins}m`;
    }

    const imageCountChange = () => {
        const numOfImages = (data.pagination.currentPage - 1) * data.pagination.itemsPerPage;
        const newPage = Math.floor(numOfImages / $imageCount) + 1;

        const url = new URL($page.url);
        url.searchParams.set('page', newPage.toString());
        url.searchParams.set('len', $imageCount.toString());
        goto(url);
    };

    const toggleSelectMode = () => {
        showSelect = !showSelect;
        if (!showSelect) {
            selectedImages.clear();
            selectedImages = new Set();
            selectedImageIds = [];
        }
    };

    const toggleImageSelection = (imageId) => {
        if (showSelect) {
            if (selectedImages.has(imageId)) {
                selectedImages.delete(imageId);
            } else {
                selectedImages.add(imageId);
            }
            selectedImages = new Set(selectedImages);
            selectedImageIds = Array.from(selectedImages);
        }
    };

    const toggleAllSelection = () => {
        if (showSelect && data.images) {
            if (selectedImages.size === data.images.length) {
                selectedImages.clear();
            } else {
                selectedImages.clear();
                data.images.forEach((img) => {
                    selectedImages.add(img._id.toString());
                });
            }
            selectedImages = new Set(selectedImages);
            selectedImageIds = Array.from(selectedImages);
        }
    };

    const toggleBatchMenu = (event) => {
        if (showSelect && selectedImages.size > 0) {
            const rect = (event.currentTarget).getBoundingClientRect();
            batchMenuPosition = { x: rect.left, y: rect.bottom };
            showBatchMenu = true;
        }
    };

    const closeBatchMenu = () => {
        showBatchMenu = false;
    };

    const handleBatchOperation = async (operation) => {
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
                const url = new URL($page.url);
                goto(url);
            }
        } catch (err) {
            console.error('Batch operation error:', err);
        }
    };

    const handleDeleteConfirm = () => {
        handleBatchOperation('delete');
    };

    const handleGroupSelect = (groupId) => {
        selectedGroupId = groupId;
        handleBatchOperation('groupAdd');
    };

    const isSelected = (imageId) => selectedImages.has(imageId);

    $: getSelectionClass = (imageId) => selectedImages.has(imageId) ? 'selected' : '';
</script>

<div class="midContainer">
    <SideBar>
        <SearchBar />
        <TagSection imageTags={[]} editable={false} />
    </SideBar>

    <div class="imageBrowser">
        <!-- Back link -->
        <a href="/postsByDate?threshold={data.thresholdMinutes}" class="back-link">
            &larr; All upload events
        </a>

        <!-- Event info header -->
        {#if data.event}
            <div class="event-header-bar">
                <h2 class="event-title">
                    Upload Event
                </h2>
                <span class="event-meta">
                    {formatDate(data.event.startDate)}, {formatTime(data.event.startDate)}
                    &mdash; {formatTime(data.event.endDate)}
                    ({data.event.imageCount} images, {formatDuration(data.event.startDate, data.event.endDate)})
                </span>
            </div>
        {/if}

        <PageNav
            currentPage={data.pagination.currentPage}
            totalPages={data.pagination.pageCount}
            {baseUrl}
            length={$imageCount}
        />

        <div class="controls-row">
            <button class="select-mode-btn" on:click={toggleSelectMode}>
                {showSelect ? 'Exit Selection' : 'Select Images'}
            </button>

            <span> Size:
                <select bind:value={$improvImageSize}>
                    {#each sizes as size}
                        <option value={size}>{size}</option>
                    {/each}
                </select>
            </span>
            <span> Length:
                <select bind:value={$imageCount} on:change={imageCountChange}>
                    {#each numImages as num}
                        <option value={num}>{num}</option>
                    {/each}
                </select>
            </span>

            {#if showSelect}
                <div class="selection-info">
                    <span>{selectedImages.size} selected</span>
                    <button class="action-btn" on:click={toggleAllSelection}>
                        {selectedImages.size === data.images?.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button class="action-btn" on:click={toggleBatchMenu} disabled={selectedImages.size === 0}>
                        Actions
                    </button>
                </div>
            {/if}
        </div>

        <div
            class="imageGrid"
            style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)"
        >
            {#if data.images}
                {#each data.images as image}
                    <div class="imageBox {getSelectionClass(image._id.toString())}">
                        <a href="/posts/{image.uploadDate}">
                            {#if image.thumbnailPath}
                                <img
                                    src="/{image.thumbnailPath}"
                                    alt=""
                                    loading="lazy"
                                    class="grid-img"
                                />
                            {:else}
                                <img
                                    src="/{image.imagePath}"
                                    alt=""
                                    loading="lazy"
                                    class="grid-img"
                                />
                            {/if}
                        </a>
                        {#if showSelect}
                            <div
                                class="selection-overlay"
                                on:click={() => toggleImageSelection(image._id.toString())}
                                role="checkbox"
                                aria-checked={selectedImages.has(image._id.toString())}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedImages.has(image._id.toString())}
                                    on:click={(e) => e.stopPropagation()}
                                    on:change={() => toggleImageSelection(image._id.toString())}
                                />
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>

        <PageNav
            currentPage={data.pagination.currentPage}
            totalPages={data.pagination.pageCount}
            {baseUrl}
        />
    </div>

    <!-- Batch action menu -->
    {#if showBatchMenu}
        <div class="batch-menu-overlay" on:click={closeBatchMenu}></div>
        <div class="batch-menu" style="left: {batchMenuPosition.x}px; top: {batchMenuPosition.y}px;">
            <button class="batch-btn favorite-btn" on:click={() => handleBatchOperation('favorite')}>
                Favorite
            </button>
            <button class="batch-btn delete-btn" on:click={() => { closeBatchMenu(); showDeleteConfirm = true; }}>
                Delete
            </button>
            <button class="batch-btn group-btn" on:click={() => { closeBatchMenu(); showGroupSelect = true; }}>
                Add to Group
            </button>
        </div>
    {/if}
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
    .midContainer {
        display: flex;
        flex-wrap: nowrap;
        height: 100%;
        align-self: stretch;
    }

    @media (min-width: 960px) {
        .midContainer {
            display: grid;
            grid-template-columns: 1fr 4fr;
        }
    }

    .imageBrowser {
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
        padding: 0px 1rem;
    }

    .back-link {
        display: block;
        width: 100%;
        padding: 8px 0;
        color: #f39c12;
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 500;
    }

    .back-link:hover {
        text-decoration: underline;
    }

    .event-header-bar {
        width: 100%;
        padding: 10px 0;
        border-bottom: 2px solid #f39c12;
        margin-bottom: 10px;
    }

    .event-title {
        margin: 0 0 4px 0;
        font-size: 1.2rem;
        color: #e67e22;
    }

    .event-meta {
        font-size: 0.85rem;
        color: #888;
    }

    .controls-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 8px 0;
    }

    .select-mode-btn {
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #ddd;
        background: #f8f8f8;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        transition: background 0.2s;
    }

    .select-mode-btn:hover {
        background: #e8e8e8;
    }

    .selection-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 10px;
        background: var(--bg-input, #f0f0f0);
        border-radius: 6px;
    }

    .action-btn {
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 13px;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .imageGrid {
        display: grid;
        gap: 5px;
        width: 100%;
    }

    .imageBox {
        position: relative;
        width: 100%;
        overflow: hidden;
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

    .grid-img {
        width: 100%;
        height: auto;
        display: block;
    }

    .selection-overlay {
        position: absolute;
        top: 6px;
        right: 6px;
        z-index: 10;
        cursor: pointer;
    }

    .selection-overlay input {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #4a90e2;
    }

    .batch-menu-overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
    }

    .batch-menu {
        position: fixed;
        z-index: 1000;
        background-color: var(--bg-card, white);
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
        background-color: var(--bg-input, #f0f0f0);
        color: var(--text-primary, #333);
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        transition: background-color 0.15s ease;
    }

    .batch-btn:hover {
        background-color: #e0e0e0;
    }

    .batch-btn.delete-btn:hover {
        background-color: #ff4444;
        color: #fff;
    }

    .batch-btn.favorite-btn:hover {
        background-color: #ffd700;
        color: #333;
    }

    .batch-btn.group-btn:hover {
        background-color: #4CAF50;
        color: #fff;
    }

    span {
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
        border: none;
        border-radius: 7px;
    }
</style>
