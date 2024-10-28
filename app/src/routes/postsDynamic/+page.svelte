<script lang="ts">
    import SearchBar from "$lib/searchBar.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import ImageBrowser from "$lib/imageBrowser.svelte";
    import Image from "$lib/image.svelte";
    import PageNav from "$lib/pageNav.svelte";
	import DropDown from "$lib/svelteComponents/dropDown.svelte";
    import Modal from "$lib/svelteComponents/modal.svelte";
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";
	import type { AppImageData, AppGroupData, AppContent } from "$lib/customTypes/DocTypes";

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

    const toggleModal = () => {
        modalShow = modalShow === false ? true : false;
        console.log(modalShow);
    }


    const toggleView = () => {
        flatState = flatState === false ? true : false;
        console.log(flatState);
    }

    const handleDragStart = (event) => {
        draggedImage = event.currentTarget.id;
    }

    const handleDragOver = (event) => {
        event.preventDefault();
        draggedOverImage = event.currentTarget.id;
    }

    const  handleDrop = (event) => {
        event.preventDefault();
        if (draggedImage && draggedOverImage) {
            console.log(draggedImage, "::", draggedOverImage);
            //Make an API call to update the group IDs on the server
              fetch('api/groups', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    draggedImage: draggedImage,
                    draggedOverImage: draggedOverImage,
                }),
              });
        }

        draggedImage = null;
        draggedOverImage = null;
    }

</script>
<div class="midContainer">
    <SideBar>
        <SearchBar/>
        <TagSection/>
    </SideBar>
    <div class="imageContainer">
        <div class="slideToggle">
            <button on:click={toggleModal} >Toggle View</button>
        </div>
        <PageNav currPage = {data.currPage} numPages = {data.pageNum} />
        <DropDown label="Image Size" options={sizes} bind:selectedValue={$improvImageSize} />
        <DropDown label="Image Count" options={numImages} bind:selectedValue={$imageCount} />
        <ImageBrowser minSize = {$improvImageSize}>
            {#each data.documents as element}
                {#if element.groupType}
                    <div class = "imageBox" id = { element._id } on:dragstart = { handleDragStart } on:dragover = { handleDragOver } on:drop = {handleDrop}>
                        {#if element.thumbnailPath}
                            <Image src = "/{ element.thumbnailPath }" 
                            mainLink = "/api/group" 
                            imageName = { element.originalName } 
                            thumbnail={ true }></Image>
                        {:else}
                            <Image src = "https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg" 
                            mainLink = "/api/groups" 
                            imageName = {element.originalName}></Image>
                        {/if}      
                    </div>                
                    {:else}
                    <div class = "imageBox" id = { element._id } on:dragstart = { handleDragStart } on:dragover = { handleDragOver } on:drop = {handleDrop}>
                        {#if element.thumbnailPath}
                            <Image src = "/{element.thumbnailPath}" 
                            mainLink = "/posts/{element.uploadDate}" 
                            imageName = {element.originalName} 
                            thumbnail={true}></Image>
                        {:else}
                            <Image src = "https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg" 
                            mainLink = "/posts/{element.uploadDate}" 
                            imageName = {element.originalName}></Image>
                        {/if}      
                    </div>
                {/if}
      
            {/each}
        </ImageBrowser>
        <PageNav currPage = {data.currPage} numPages = {data.pageNum} />
    </div>
    <Modal show={modalShow}></Modal>
</div>

<style>
    .midContainer{
        display:grid;
        height:100%;
    }

    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 1fr 4fr;
        }
    }

    .slideToggle{
        display: flex;
        justify-content: center;
        margin: 12px;
    }

    .slideToggle button{
        padding: 12px;
        font-size: 1.5rem;
    }

</style>