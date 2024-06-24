<script lang="ts">
    import SearchBar from "$lib/searchBar.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import ImageBrowser from "$lib/imageBrowser.svelte";
    import Image from "$lib/image.svelte";
    import PageNav from "$lib/pageNav.svelte";
	import DropDown from "$lib/dropDown.svelte";
    import Modal from "$lib/svelteComponents/modal.svelte";

    //script imports
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";
	import type { AppImageData } from "$lib/server/types";
    import { groupNameGenerator } from "$lib/utilityModel";

    interface Images {
        images: AppImageData[];
        currPage: number;
        pageNum: number;
    }

    export let data : Images;

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

    const  handleDrop = async (event) => {
        event.preventDefault();
        if (draggedImage && draggedOverImage) {
            console.log(draggedImage, "::", draggedOverImage);
            let groupName = groupNameGenerator();

            // Make POST request to create the group
            const postResponse = await fetch('api/groups', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                group: { name: groupName },
                }),
            });

            if (!postResponse.ok) {
                throw new Error('Failed to create group');
            }

            const postData = await postResponse.json();
            
            const putResponse = await fetch(`api/groups`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parentGroupId: postData.parentGroupId,
                    addDocuments: [draggedOverImage, draggedImage]
                }),
            });

            if (!putResponse.ok) {
                throw new Error('Failed to update group');
            }

            const putData = await putResponse.json();

            if (putData.success) {
                console.log('Group updated successfully');
                // Here you might want to update your UI or state
            } else {
                console.error('Failed to update group:', putData.message);
            }
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
            {#each data.images as image}

                    <div class="imageBox" id={image._id} on:dragstart={handleDragStart} on:dragover={handleDragOver} on:drop={handleDrop} role="presentation">
                        {#if image.thumbnailPath}
                            <Image src="/{image.thumbnailPath}" 
                            mainLink="/posts/{image.uploadDate}" 
                            imageName={image.name} 
                            thumbnail={true}></Image>
                        {:else}
                            <Image src="/{image.imagePath}" 
                            alt={image.name}
                            mainLink="/posts/{image.uploadDate}" 
                            imageName={image.name}
                            ></Image>
                        {/if}      
                    </div>
      
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