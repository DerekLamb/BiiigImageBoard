<script lang="ts">
    import { goto } from "$app/navigation";
    import type { PageData } from "./$types";
    import SideBar from "$lib/sideBar.svelte";
    import SearchBar from "$lib/searchBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import ReturnButton from '$lib/returnButton.svelte';

    let { data }: { data: PageData } = $props();

    let currentIndex = $state(data.startIndex);
    let images = $state(data.images);
    let currentPage = $state(data.page);
    let totalImages = $state(data.totalImages);
    let loadingMore = $state(false);

    let showConfirm = $state(false);
    let deleting = $state(false);
    let imageLoaded = $state(false);

    $effect(() => {
        images = data.images;
        currentIndex = data.startIndex;
        currentPage = data.page;
        totalImages = data.totalImages;
    });

    let currentImage = $derived(images[currentIndex] ?? null);
    let hasPrev = $derived(currentIndex > 0);
    let hasNext = $derived(currentIndex < images.length - 1 || currentIndex < totalImages - 1);

    async function loadPage(pageNum: number) {
        if (loadingMore) return;
        loadingMore = true;
        try {
            const params = new URLSearchParams();
            if (data.searchTerm) params.set('search', data.searchTerm);
            if (data.notag) params.set('notag', data.notag);
            params.set('page', String(pageNum));
            const resp = await fetch(`/api/review/page?${params}`);
            const result = await resp.json();
            if (result.images?.length) {
                images = [...images, ...result.images];
                currentPage = pageNum;
            }
        } catch (err) {
            console.error('Failed to load more images:', err);
        } finally {
            loadingMore = false;
        }
    }

    function navigateTo(index: number) {
        if (index >= 0 && index < images.length) {
            currentIndex = index;
            imageLoaded = false;
            showConfirm = false;
        }
        if (index >= images.length - 20 && totalImages > images.length) {
            loadPage(currentPage + 1);
        }
    }

    function goPrev() {
        if (hasPrev) navigateTo(currentIndex - 1);
    }

    function goNext() {
        if (hasNext) navigateTo(currentIndex + 1);
    }

    async function deleteCurrent() {
        if (!currentImage || deleting) return;
        deleting = true;

        try {
            const resp = await fetch('/api/review/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId: currentImage._id })
            });
            const result = await resp.json();
            if (result.success) {
                const deletedIndex = currentIndex;
                images = images.filter((_: unknown, i: number) => i !== deletedIndex);
                totalImages--;
                if (images.length === 0) {
                    goto('/posts');
                    return;
                }
                if (deletedIndex >= images.length) {
                    currentIndex = images.length - 1;
                } else {
                    currentIndex = deletedIndex;
                }
                imageLoaded = false;
                showConfirm = false;
            } else {
                console.error('Delete failed:', result.error);
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            deleting = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goPrev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goNext();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (e.key === 'Backspace' && !showConfirm) {
                e.preventDefault();
                showConfirm = true;
            } else if (e.key === 'Delete') {
                e.preventDefault();
                showConfirm = true;
            }
        } else if (e.key === 'Escape') {
            showConfirm = false;
        } else if (e.key === 'Enter' && showConfirm) {
            e.preventDefault();
            deleteCurrent();
        }
    }

    function imageSrc(path: string | undefined) {
        if (!path) return '';
        if (path.startsWith('/')) return path;
        return '/' + path;
    }

    function formatDate(dateStr: string | undefined) {
        if (!dateStr) return '';
        const ts = parseInt(dateStr);
        if (!isNaN(ts)) {
            return new Date(ts).toLocaleString();
        }
        return dateStr;
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="reviewContainer">
    <div class="sidebar">
        <SideBar itemCount={3}>
            <SearchBar />
            <TagSection imageTags={[]} editable={false} />
            <ReturnButton />
        </SideBar>
        <div class="navLinks">
            <a href="/posts" class="navLink">Back to Grid</a>
        </div>
    </div>

    <div class="mainArea">
        <div class="toolbar">
            <button onclick={goPrev} disabled={!hasPrev} class="toolBtn" title="Previous (Left Arrow)">
                ← Prev
            </button>

            <span class="position">
                {currentIndex + 1} / {totalImages}
                {#if currentImage}
                    <span class="filename">— {currentImage.originalName}</span>
                    <span class="date">{formatDate(currentImage.uploadDate)}</span>
                {/if}
            </span>

            <button onclick={goNext} disabled={!hasNext} class="toolBtn" title="Next (Right Arrow)">
                Next →
            </button>

            <button
                onclick={() => showConfirm = !showConfirm}
                class="toolBtn deleteBtn"
                title="Delete (Delete key)"
            >
                🗑️ Delete
            </button>
        </div>

        {#if showConfirm}
            <div class="confirmOverlay" onclick={() => showConfirm = false}>
                <div class="confirmDialog" onclick={(e) => e.stopPropagation()}>
                    <p>Delete this image?</p>
                    <p class="confirmName">{currentImage?.originalName}</p>
                    <div class="confirmActions">
                        <button onclick={deleteCurrent} disabled={deleting} class="confirmDelete">
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button onclick={() => showConfirm = false} class="confirmCancel">Cancel</button>
                    </div>
                    <p class="keyHint">Enter to confirm · Esc to cancel</p>
                </div>
            </div>
        {/if}

        <div class="imageArea">
            {#if currentImage}
                {#if currentImage.type === 'video'}
                    <video
                        controls
                        class="reviewMedia"
                        class:hidden={!imageLoaded}
                        onloadeddata={() => imageLoaded = true}
                    >
                        <source src={imageSrc(currentImage.imagePath)} />
                    </video>
                {:else}
                    <img
                        src={imageSrc(currentImage.imagePath)}
                        alt={currentImage.originalName}
                        class="reviewMedia"
                        class:hidden={!imageLoaded}
                        onload={() => imageLoaded = true}
                    />
                {/if}
                {#if !imageLoaded}
                    <div class="loadingSpinner">Loading...</div>
                {/if}
            {:else}
                <div class="emptyState">
                    <p>No images to review</p>
                    <a href="/posts" class="navLink">Back to Grid</a>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .reviewContainer {
        display: flex;
        height: 100%;
        min-height: calc(100vh - 80px);
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .navLinks {
        padding: 8px 16px;
    }

    .navLink {
        color: #007bff;
        text-decoration: none;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
    }

    .navLink:hover {
        text-decoration: underline;
    }

    .mainArea {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 8px 16px;
        overflow: hidden;
    }

    .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #dee2e6;
        flex-shrink: 0;
    }

    .toolBtn {
        padding: 6px 14px;
        border: 1px solid #ced4da;
        border-radius: 6px;
        background: #f8f9fa;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #495057;
        transition: background 0.15s;
    }

    .toolBtn:hover:not(:disabled) {
        background: #e9ecef;
    }

    .toolBtn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .deleteBtn {
        margin-left: auto;
        border-color: #dc3545;
        color: #dc3545;
    }

    .deleteBtn:hover {
        background: #dc3545;
        color: white;
    }

    .position {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        color: #495057;
        white-space: nowrap;
    }

    .filename {
        color: #6c757d;
        font-size: 0.8rem;
        margin-left: 8px;
    }

    .date {
        color: #adb5bd;
        font-size: 0.75rem;
        margin-left: 8px;
    }

    .imageArea {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 16px 0;
        overflow: hidden;
    }

    .reviewMedia {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }

    .reviewMedia.hidden {
        display: none;
    }

    .loadingSpinner {
        color: #6c757d;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
    }

    .emptyState {
        text-align: center;
        color: #6c757d;
        font-family: 'Montserrat', sans-serif;
    }

    /* Confirm dialog */
    .confirmOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .confirmDialog {
        background: white;
        border-radius: 12px;
        padding: 24px 32px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .confirmDialog p {
        margin: 0 0 8px 0;
        font-family: 'Montserrat', sans-serif;
        color: #343a40;
    }

    .confirmName {
        font-weight: 600;
        font-size: 0.9rem;
        color: #6c757d !important;
        word-break: break-all;
    }

    .confirmActions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
    }

    .confirmDelete {
        padding: 8px 20px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
    }

    .confirmDelete:hover:not(:disabled) {
        background: #c82333;
    }

    .confirmDelete:disabled {
        opacity: 0.6;
    }

    .confirmCancel {
        padding: 8px 20px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
    }

    .confirmCancel:hover {
        background: #545b62;
    }

    .keyHint {
        font-size: 0.75rem !important;
        color: #adb5bd !important;
        margin-top: 12px !important;
    }
</style>
