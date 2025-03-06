<script>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";

/** @type {import('./$types').PageData} */ 
export let data;
let tags = data.group?.groupTags ?? [];
</script>

<div class="midContainer">
    <SideBar>
        <SearchBar></SearchBar>
        <TagSection editable={true} ></TagSection>
    </SideBar>

    <div class="contentContainer">
        <div class="groupHeader">
            <h1>{data.group?.name || 'Group Not Found'}</h1>
            {#if data.group}
                <div class="groupInfo">
                    <p><span>Created:</span> {new Date(data.group.uploadDate).toLocaleString()}</p>
                    <p><span>ID:</span> {data.group._id}</p>
                    <p><span>Images:</span> {data.images.length}</p>
                </div>
                
                <form method="post" action="?/delete">
                    <button type="submit" class="deleteBtn">Delete Group</button>
                    <input type="hidden" name="groupId" value="{data.group._id}">
                </form>
            {/if}
        </div>

        {#if data.group && data.images.length > 0}
            <div class="imagesGrid">
                {#each data.images as image}
                    <div class="imageCard">
                        <a href="/posts/{image.uploadDate}">
                            <img src="/{image.thumbnailPath}" alt={image.originalName} />
                        </a>
                        <div class="imageControls">
                            <form method="post" action="?/removeImage">
                                <button type="submit">Remove</button>
                                <input type="hidden" name="groupId" value="{data.group._id}">
                                <input type="hidden" name="imageId" value="{image._id}">
                            </form>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if data.group}
            <div class="emptyState">
                <p>This group has no images.</p>
            </div>
        {:else}
            <div class="errorState">
                <p>Group not found. It may have been deleted or you don't have permission to view it.</p>
                <a href="/postGroups" class="backLink">Back to Groups</a>
            </div>
        {/if}
    </div>
</div>

<style>
    .midContainer {
        display: grid;
        gap: 60px;
        height: 100%;
        align-self: stretch;
    }
    
    @media (min-width: 960px) {
        .midContainer {
            grid-template-columns: 200px 1fr;
        }
    }
    
    .contentContainer {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .groupHeader {
        background-color: #9ac7d6;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
    }
    
    .groupHeader h1 {
        margin-top: 0;
        margin-bottom: 10px;
    }
    
    .groupInfo {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
    }
    
    .imagesGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        background-color: #9ac7d6;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
    }
    
    .imageCard {
        background-color: white;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    
    .imageCard:hover {
        transform: translateY(-5px);
    }
    
    .imageCard img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        display: block;
    }
    
    .imageControls {
        padding: 8px;
        display: flex;
        justify-content: space-between;
    }
    
    .imageControls button {
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
    }
    
    .imageControls button:hover {
        background-color: #e0e0e0;
    }
    
    .deleteBtn {
        background-color: #ff6b6b;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        margin-top: 10px;
    }
    
    .deleteBtn:hover {
        background-color: #ff5252;
    }
    
    .emptyState, .errorState {
        background-color: #9ac7d6;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
    }
    
    .errorState {
        background-color: #ffefef;
    }
    
    .backLink {
        display: inline-block;
        margin-top: 10px;
        background-color: #4a90e2;
        color: white;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 4px;
    }
    
    span {
        font-weight: bold;
    }
</style>