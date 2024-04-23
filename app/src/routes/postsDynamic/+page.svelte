<script lang="ts">
    import SearchBar from "$lib/searchBar.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import ImageBrowser from "$lib/imageBrowser.svelte";
    import Image from "$lib/image.svelte";
    import PageNav from "$lib/pageNav.svelte";
	import DropDown from "$lib/dropDown.svelte";
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";

    interface Images {
        images: {
            originalName: string;
            thumbnailPath: string;
            imagePath: string;
            uploadDate: string;
        }[];
        currPage: number;
        pageNum: number;
    }

    export let data : Images;

    const sizes = [100, 110, 150, 200, 300];
    const numImages = [24, 32, 48, 60, 72, 84, 96];

    let flatState : boolean = true; 
    let draggedImage = null;
    let draggedOverImage = null;
    let draggable = false;


    const toggleView = () => {
        flatState = flatState === false ? true : false;
        console.log(flatState);
    }

    const handleDragStart = (event, image) => {
        let draggedImage = image;
    }

    const handleDragOver = (event, image) => {
        event.preventDefault();
        let draggedOverImage = image;
    }

    const  handleDrop = (event) => {
        event.preventDefault();
        if (draggedImage && draggedOverImage && draggable) {
            console.log(draggedImage, "::", draggedOverImage);
            // Make an API call to update the group IDs on the server
            //   fetch('api/update-groups', {
            //     method: 'POST',
            //     headers: {
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(updatedImages),
            //   });
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
            <button on:click={toggleView} >Toggle View</button>
        </div>
        <PageNav currPage = {data.currPage} numPages = {data.pageNum} />
        <DropDown label="Image Size" options={sizes} bind:selectedValue={$improvImageSize} />
        <DropDown label="Image Count" options={numImages} bind:selectedValue={$imageCount} />
        <ImageBrowser minSize = {$improvImageSize}>
            {#each data.images as image}
                <Image src = "/{image.thumbnailPath}" link = "/posts/{image.uploadDate}" imageName = {image.originalName} thumbnail={true}></Image>
            {/each}
        </ImageBrowser>
        <PageNav currPage = {data.currPage} numPages = {data.pageNum} />
    </div>
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