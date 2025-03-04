<script lang="ts">
    import SearchBar from "$lib/searchBar.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import ImageBrowser from "$lib/imageBrowser.svelte";
    import Image from "$lib/image.svelte";
    import GroupThmb from "$lib/svelteComponents/groupThmb.svelte";
    import PageNav from "$lib/pageNav.svelte";
    import DropDown from "$lib/svelteComponents/dropDown.svelte";
    import Modal from "$lib/svelteComponents/modal.svelte";
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";
    import type { AppContent, AppGroup } from "$lib/customTypes/DocTypes";

    interface DataResponse {
        documents: AppContent[];
        currPage: number;
        pageNum: number;
    }

    export let data : DataResponse;

    const sizes = [100, 110, 150, 200, 300];
    const numImages = [24, 32, 48, 60, 72, 84, 96];

    let flatState : boolean = true; 
    let draggedImage = null;
    let draggedOverImage = null;
    let modalShow = false;
    let draggable = false;
    let selectedGroupId = "";
    let groups = [];
    let showAddToGroupModal = false;
    let groupAddMode = false;
    let selectedImages = new Set();
    let newGroupName = "";
    let createNewGroup = false;

    // Fetch available groups for "Add to Group" functionality
    const fetchGroups = async () => {
        try {
            const response = await fetch('api/groups');
            const data = await response.json();
            if (data.success && data.groups) {
                groups = await data.groups;
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    // Call fetchGroups on component mount
    fetchGroups();


    const toggleGroupAddMode = () => {
        groupAddMode = !groupAddMode;
        if (!groupAddMode) {
            selectedImages.clear();
            selectedImages = selectedImages; 
        }
    }

    const toggleImageSelection = (imageId: string) => {
        
        if (selectedImages.has(imageId)) {
            selectedImages.delete(imageId);
        } else {
            selectedImages.add(imageId);
        }
        selectedImages = selectedImages; // Trigger reactivity
    }

    const toggleAddToGroupModal = () => {
        if (selectedImages.size === 0) {
            alert("Please select at least one image");
            return;
        }
        showAddToGroupModal = !showAddToGroupModal;
    }

    const toggleView = () => {
        flatState = !flatState;
    }

    const handleDragStart = (event) => {
        draggedImage = event.currentTarget.id;
    }

    const handleDragOver = (event) => {
        event.preventDefault();
        draggedOverImage = event.currentTarget.id;
    }

    const handleDrop = (event) => {
        event.preventDefault();
        if (draggedImage && draggedOverImage) {
            console.log(draggedImage, "::", draggedOverImage);
            //Make an API call to create a new group with these images
            fetch('api/groups', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    draggedImage: draggedImage,
                    draggedOverImage: draggedOverImage,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Group created with ID:", data.groupId);
                    // Refresh the groups list
                    fetchGroups();
                }
            });
        }

        draggedImage = null;
        draggedOverImage = null;
    }

    const toggleCreateNewGroup = () => {
        createNewGroup = !createNewGroup;
        if (!createNewGroup) {
            newGroupName = "";
        }
    }

    const createGroup = async () => {
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
                selectedImages.clear();
                selectedImages = selectedImages;
                groupAddMode = false;
                newGroupName = "";
                createNewGroup = false;
                
                // Refresh the groups list
                fetchGroups();
            } else {
                console.error("Failed to create group:", result.error);
                alert("Failed to create group");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Error creating group");
        }
    }

    const addToExistingGroup = async () => {
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
            // Process each image one by one
            const promises = imageIds.map(imageId => 
                fetch('api/groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        groupId: selectedGroupId,
                        imageId: imageId
                    }),
                }).then(response => response.json())
            );
            
            const results = await Promise.all(promises);
            
            if (results.every(result => result.success)) {
                console.log("All images added to group successfully");
                showAddToGroupModal = false;
                selectedImages.clear();
                selectedImages = selectedImages;
                groupAddMode = false;
                selectedGroupId = "";
                
                // Refresh the page
                window.location.reload();
            } else {
                console.error("Some images failed to be added to the group");
                alert("Some images failed to be added to the group");
            }
        } catch (error) {
            console.error("Error adding images to group:", error);
            alert("Error adding images to group");
        }
    }

    const selectAllImages = () => {
        data.documents.forEach(element => {
            if (!element.groupType) {
                selectedImages.add(element._id);
            }
        });
        selectedImages = selectedImages; // Trigger reactivity
    }

    const clearSelection = () => {
        selectedImages.clear();
        selectedImages = selectedImages; // Trigger reactivity
    }
</script>

<div class="midContainer">
    <SideBar>
        <SearchBar />
        <TagSection />
    </SideBar>
    <div class="imageContainer">
        <div class="controlBar">
            <button class="groupButton" class:active={groupAddMode} on:click={toggleGroupAddMode}>
                {groupAddMode ? 'Exit Group Mode' : 'Enter Group Mode'}
            </button>
            
            {#if groupAddMode}
                <div class="groupControls">
                    <button on:click={selectAllImages}>Select All</button>
                    <button on:click={clearSelection}>Clear Selection</button>
                    <span class="selectedCount">{selectedImages.size} selected</span>
                    <button class="addToGroupBtn" on:click={toggleAddToGroupModal} disabled={selectedImages.size === 0}>
                        Add to Group
                    </button>
                </div>
            {/if}
        </div>

        <PageNav currPage={data.currPage} numPages={data.pageNum} />
        <DropDown label="Image Size" options={sizes} bind:selectedValue={$improvImageSize} />
        <DropDown label="Image Count" options={numImages} bind:selectedValue={$imageCount} />
        
        <ImageBrowser minSize={$improvImageSize}>
            {#each data.documents as element}
                {#if element.groupType}
                    <!-- Group element -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="imageBox" id={element._id} 
                         on:dragstart={handleDragStart} 
                         on:dragover={handleDragOver} 
                         on:drop={handleDrop}>
                        {#if element.thumbnailPaths}
                            <GroupThmb
                                anchorLink="/postGroups/{element._id}"
                                thmbSrc={element.thumbnailPaths[1]} 
                                name={element.name} />
                        {:else}
                            <GroupThmb 
                                thmbSrc="https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg" 
                                anchorLink="/postGroups/{element._id}"
                                name={element.name} />
                        {/if}      
                    </div>                
                {:else}
                    <!-- Image element -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="imageBox" 
                         class:selected={selectedImages.has(element._id)}
                         id={element._id} 
                         on:dragstart={handleDragStart} 
                         on:dragover={handleDragOver} 
                         on:drop={handleDrop}>
                        {#if element.thumbnailPath}
                            <div class="imageWrapper">
                                <Image 
                                    src="/{element.thumbnailPath}" 
                                    mainLink={groupAddMode ? "" : "/posts/{element.uploadDate}"}
                                    imageName={element.originalName} 
                                    thumbnail={true}
                                    selectable={groupAddMode}
                                    on:select={() => toggleImageSelection(element._id)}
                                />
                                {#if groupAddMode}
                                    <div class="checkboxOverlay">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedImages.has(element._id)}
                                            on:change={() => toggleImageSelection(element._id)}
                                        />
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div class="imageWrapper">
                                <Image 
                                    src="https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg" 
                                    mainLink={groupAddMode ? "" : "/posts/{element.uploadDate}"}
                                    imageName={element.originalName}
                                    selectable={groupAddMode}
                                    on:select={() => toggleImageSelection(element._id)}
                                />
                                {#if groupAddMode}
                                    <div class="checkboxOverlay">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedImages.has(element._id)}
                                            on:change={() => toggleImageSelection(element._id)}
                                        />
                                    </div>
                                {/if}
                            </div>
                        {/if}      
                    </div>
                {/if}
            {/each}
        </ImageBrowser>
        <PageNav currPage={data.currPage} numPages={data.pageNum} />
    </div>
    <Modal show={modalShow}></Modal>
    
    <!-- Add to Group Modal -->
    {#if showAddToGroupModal}
    <div class="modalOverlay">
        <div class="modalContent">
            <h3>Add {selectedImages.size} Images to Group</h3>
            
            <div class="groupOptions">
                <label>
                    <input type="radio" name="groupOption" checked={!createNewGroup} on:change={() => createNewGroup = false}>
                    Add to existing group
                </label>
                <label>
                    <input type="radio" name="groupOption" checked={createNewGroup} on:change={() => createNewGroup = true}>
                    Create new group
                </label>
            </div>
            
            {#if createNewGroup}
                <div class="newGroupForm">
                    <label for="newGroupName">Group Name</label>
                    <input 
                        type="text" 
                        id="newGroupName" 
                        bind:value={newGroupName} 
                        placeholder="Enter group name (or timestamp will be used)"
                    >
                </div>
            {:else}
                <div class="groupSelector">
                    <select bind:value={selectedGroupId}>
                        <option value="">Select a group</option>
                        {#each groups as group}
                            <option value={group._id}>{group.name}</option>
                        {/each}
                    </select>
                </div>
            {/if}
            
            <div class="modalActions">
                {#if createNewGroup}
                    <button on:click={createGroup}>Create Group</button>
                {:else}
                    <button on:click={addToExistingGroup} disabled={!selectedGroupId}>Add to Group</button>
                {/if}
                <button on:click={() => showAddToGroupModal = false}>Cancel</button>
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

    .controlBar {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 10px;
        background-color: #f0f0f0;
        border-radius: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }

    .groupButton {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .groupButton.active {
        background-color: #e74c3c;
    }
    
    .groupControls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .groupControls button {
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
    }
    
    .selectedCount {
        background-color: #4a90e2;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.9rem;
    }
    
    .addToGroupBtn {
        background-color: #2ecc71 !important;
        color: white;
    }
    
    .addToGroupBtn:disabled {
        background-color: #ccc !important;
        cursor: not-allowed;
    }
    
    .imageWrapper {
        position: relative;
    }
    
    .checkboxOverlay {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
    }
    
    .checkboxOverlay input {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .imageBox.selected {
        outline: 3px solid #4a90e2;
        position: relative;
    }
    
    .imageBox.selected::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(74, 144, 226, 0.1);
        z-index: 5;
    }
    
    .modalOverlay {
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
    
    .modalContent {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 400px;
        max-width: 90%;
    }
    
    .groupSelector, .newGroupForm {
        margin: 20px 0;
    }
    
    .groupSelector select, .newGroupForm input {
        width: 100%;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        margin-top: 5px;
    }
    
    .groupOptions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 15px 0;
    }
    
    .modalActions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    
    .modalActions button {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .modalActions button:first-child {
        background-color: #4a90e2;
        color: white;
        border: none;
    }
    
    .modalActions button:first-child:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
    
    .modalActions button:last-child {
        background-color: #f0f0f0;
        border: 1px solid #ddd;
    }
</style>