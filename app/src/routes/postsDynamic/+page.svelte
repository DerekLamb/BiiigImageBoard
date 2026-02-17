<script lang="ts">
    import ContentGrid from '$lib/svelteComponents/contentGrid.svelte';
    import ControlBar from '$lib/svelteComponents/ControlBar.svelte';
    import { page } from '$app/state';
    import SearchBar from "$lib/searchBar.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import PageNav from "$lib/pageNav.svelte";
    import Modal from "$lib/svelteComponents/modal.svelte";
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";
    import type { AppContent } from "$lib/types/DocTypes.js";
    import { onMount } from "svelte";

    interface DataResponse {
        documents: AppContent[];
        currPage: number;
        pageNum: number;
    }

    interface Group {
        _id: string;
        name: string;
        imageCount?: number;
    }

    interface Props {
        data: DataResponse;
    }

    let { data }: Props = $props();

    // URL state - using $derived for reactive values
    let viewMode = $derived(page.url.searchParams.get('mode') || 'browse');
    let selectGroup = $derived(page.url.searchParams.get('group'));
    let positionImageId = $derived(page.url.searchParams.get('imageId'));

    //Nav link location
    let browseDir = "/postsDynamic"

    // Group mode state
    let groupMode = $state(false);
    let selectedImages = $state<Set<string>>(new Set());
    let groups = $state<Group[]>([]);
    let showAddToGroupModal = $state(false);
    let selectedGroupId = $state("");
    let newGroupName = $state("");
    let createNewGroup = $state(false);
    let isDeleting = $state(false);
    let showDeleteModal = $state(false);

    // Computed
    let selectionCount = $derived(selectedImages.size);

    // Fetch available groups on mount
    onMount(() => {
        fetchGroups();
        
        // Listen for ControlBar events
        window.addEventListener('toggle-group-mode', handleToggleGroupMode);
        window.addEventListener('select-all', handleSelectAll);
        window.addEventListener('clear-selection', handleClearSelection);
        window.addEventListener('add-to-group', handleAddToGroup);
        window.addEventListener('delete-selected', handleDeleteSelected);

        return () => {
            window.removeEventListener('toggle-group-mode', handleToggleGroupMode);
            window.removeEventListener('select-all', handleSelectAll);
            window.removeEventListener('clear-selection', handleClearSelection);
            window.removeEventListener('add-to-group', handleAddToGroup);
            window.removeEventListener('delete-selected', handleDeleteSelected);
        };
    });

    // Fetch available groups for "Add to Group" functionality
    async function fetchGroups() {
        try {
            const response = await fetch('/api/groups');
            const json = await response.json();
            if (json.groups) {
                groups = json.groups;
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    }

    // Event handlers
    function handleToggleGroupMode() {
        groupMode = !groupMode;
        if (!groupMode) {
            selectedImages = new Set();
        }
    }

    function handleSelectAll() {
        const imageIds = data.documents
            .filter((doc: AppContent) => !('groupType' in doc))
            .map((doc: AppContent) => doc._id);
        selectedImages = new Set(imageIds);
    }

    function handleClearSelection() {
        selectedImages = new Set();
    }

    function handleAddToGroup() {
        if (selectedImages.size === 0) {
            alert("Please select at least one image");
            return;
        }
        showAddToGroupModal = true;
    }

    function handleDeleteSelected() {
        if (selectedImages.size === 0) {
            alert("Please select at least one image");
            return;
        }
        showDeleteModal = true;
    }

    // Toggle image selection
    function toggleImageSelection(imageId: string) {
        const newSet = new Set(selectedImages);
        if (newSet.has(imageId)) {
            newSet.delete(imageId);
        } else {
            newSet.add(imageId);
        }
        selectedImages = newSet;
    }

    // Handle drag-drop group creation
    async function handleDrop(sourceId: string, targetId: string) {
        try {
            const response = await fetch('api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: Date.now().toString(),
                    imageIds: [sourceId, targetId],
                }),
            });
            const result = await response.json();
            if (result.success) {
                console.log("Group created with ID:", result.data._id);
                // Refresh the page to show updated content
                window.location.reload();
            }
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    // Create a new group with selected images
    async function createGroup() {
        if (selectedImages.size === 0) {
            alert("Please select at least one image");
            return;
        }

        const imageIds = Array.from(selectedImages);
        const name = newGroupName || Date.now().toString();

        try {
            const response = await fetch('api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    imageIds: imageIds
                }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log("Group created successfully");
                showAddToGroupModal = false;
                selectedImages = new Set();
                groupMode = false;
                newGroupName = "";
                createNewGroup = false;
                
                // Refresh the page
                window.location.reload();
            } else {
                console.error("Failed to create group:", result.error);
                alert("Failed to create group:" + result.error);
            }
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Error creating group");
        }
    }

    // Add selected images to existing group
    async function addToExistingGroup() {
        if (selectedImages.size === 0) {
            alert("Please select at least one image");
            return;
        }

        if (!selectedGroupId) {
            alert("Please select a group");
            return;
        }

        const imageIds = Array.from(selectedImages);

        try {
            const response = await fetch(`api/groups/${selectedGroupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'add-images',
                    imageIds: imageIds
                }),
            });

            const result = await response.json();

            if (result.message && result.message.includes('Added')) {
                console.log("All images added to group successfully");
                showAddToGroupModal = false;
                selectedImages = new Set();
                groupMode = false;
                selectedGroupId = "";

                // Refresh the page
                window.location.reload();
            } else {
                console.error("Failed to add images to the group:", result.message);
                alert("Failed to add images to the group: " + result.message);
            }
        } catch (error) {
            console.error("Error adding images to group:", error);
            alert("Error adding images to group");
        }
    }

    // Confirm bulk delete
    async function confirmBulkDelete() {
        isDeleting = true;
        const imageIds = Array.from(selectedImages);
        const imagesToDelete = data.documents.filter((doc: AppContent) => imageIds.includes(doc._id) && !('groupType' in doc));

        try {
            const response = await fetch('/api/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deleteImages',
                    images: imagesToDelete
                }),
            });

            const result = await response.json();

            if (result.success) {
                console.log("Bulk delete completed:", result.message);
                showDeleteModal = false;
                selectedImages = new Set();
                groupMode = false;
                // Refresh the page to show updated content
                window.location.reload();
            } else {
                console.error("Bulk delete failed:", result.error);
                alert("Failed to delete some images");
            }
        } catch (error) {
            console.error("Error during bulk delete:", error);
            alert("Error deleting images");
        } finally {
            isDeleting = false;
        }
    }
</script>

<div class="midContainer">
    <SideBar>
        <SearchBar />
        <TagSection imageTags={[]} editable={false} />
    </SideBar>

    <div class="imageContainer">
        <PageNav baseUrl={browseDir} currentPage={data.currPage} totalPages={data.pageNum} />
        
        <ControlBar
            mode={viewMode as 'browse' | 'select' | 'groupDetail'}
            {groupMode}
            {selectionCount}
        />
        
        <ContentGrid
            documents={data.documents ?? []}
            mode={viewMode}
            {groupMode}
            selectedIds={selectedImages}
            onToggleSelection={toggleImageSelection}
            onDrop={handleDrop}
        />
        
        <PageNav baseUrl={browseDir} currentPage={data.currPage} totalPages={data.pageNum} />
    </div>

    <!-- Add to Group Modal -->
    {#if showAddToGroupModal}
        <div class="modal-overlay" onclick={() => showAddToGroupModal = false}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <h3>Add to Group</h3>
                <p>{selectionCount} images selected</p>
                
                <div class="group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="groupOption" 
                            checked={!createNewGroup}
                            onchange={() => createNewGroup = false}
                        />
                        Add to existing group
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="groupOption" 
                            checked={createNewGroup}
                            onchange={() => createNewGroup = true}
                        />
                        Create new group
                    </label>
                </div>

                {#if createNewGroup}
                    <div class="new-group-form">
                        <label>
                            Group Name (optional):
                            <input 
                                type="text" 
                                bind:value={newGroupName}
                                placeholder="Leave empty for auto-generated name"
                            />
                        </label>
                    </div>
                {:else}
                    <div class="group-selector">
                        <label>
                            Select Group:
                            <select bind:value={selectedGroupId}>
                                <option value="">-- Select a group --</option>
                                {#each groups as group}
                                    <option value={group._id}>{group.name} ({group.imageCount || 0} images)</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                {/if}

                <div class="modal-actions">
                    <button 
                        onclick={createNewGroup ? createGroup : addToExistingGroup}
                        disabled={(!createNewGroup && !selectedGroupId)}
                    >
                        {createNewGroup ? 'Create Group' : 'Add to Group'}
                    </button>
                    <button onclick={() => showAddToGroupModal = false}>Cancel</button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="modal-overlay" onclick={() => showDeleteModal = false}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete {selectionCount} images?</p>
                <p class="warning">This action cannot be undone.</p>
                
                <div class="modal-actions">
                    <button 
                        onclick={confirmBulkDelete}
                        disabled={isDeleting}
                        class="delete-btn"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button onclick={() => showDeleteModal = false}>Cancel</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .midContainer {
        display: grid;
        height: 100%;
    }

    @media (min-width: 960px) {
        .midContainer {
            grid-template-columns: 1fr 4fr;
        }
    }

    .imageContainer {
        padding: 10px;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 400px;
        max-width: 90%;
    }

    .modal-content h3 {
        margin-top: 0;
        margin-bottom: 10px;
    }

    .group-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 15px 0;
    }

    .group-options label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }

    .group-selector,
    .new-group-form {
        margin: 20px 0;
    }

    .group-selector label,
    .new-group-form label {
        display: block;
    }

    .group-selector select,
    .new-group-form input {
        width: 100%;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        margin-top: 5px;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }

    .modal-actions button {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
    }

    .modal-actions button:first-child {
        background-color: #4a90e2;
        color: white;
        border: none;
    }

    .modal-actions button:first-child:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .modal-actions button:last-child {
        background-color: #f0f0f0;
        border: 1px solid #ddd;
    }

    .delete-btn {
        background-color: #e74c3c !important;
    }

    .warning {
        color: #e74c3c;
        font-size: 0.9rem;
    }
</style>
