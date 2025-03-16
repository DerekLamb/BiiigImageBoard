<script lang="ts">
import { improvImageSize, imageCount } from "$lib/stores/searchStore";
import PageNav from "$lib/pageNav.svelte";
import Image from "$lib/image.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";


/** @type {import('./$types').PageData} */ 


/* 
    return {
        status: 200,
        images: images,
        pagination: {
            total: totalCount,
            pageCount: numPages,
            currentPage: pageNum,
            itemsPerPage: lengthNum
        },
        searchTerm: searchTerm,
        notag: notag
    }
        */

export let data;

let baseUrl: string = "/posts";
const sizes = [100, 110, 150, 200, 300];
const numImages = [24, 32, 48, 60, 72, 84, 96];

</script>

<div class = midContainer>
    <SideBar>
        <SearchBar />
        <TagSection imageTags={[]} editable={false}/>
    </SideBar>
    <div class = "imageBrowser">
        <PageNav currentPage={data.pagination.currentPage} totalPages = {data.pagination.pageCount} baseUrl = {baseUrl}/>
        <span> Size:
            <select bind:value={$improvImageSize} >
                {#each sizes as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </span>
        <span> Length:
            <select bind:value={$imageCount} >
                {#each numImages as num}
                    <option value={num}>{num}</option>
                {/each}
            </select>
        </span>
        <div class = "imageGrid" style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)">
        {#if data.images}
            {#each data.images as image}
                {#if image.thumbnailPath}
                    <div class = "imageBox">
                        <Image src = "/{image.thumbnailPath}" 
                        mainLink = "/posts/{image.uploadDate}" 
                         
                        thumbnail={true}></Image>
                    </div>
                {:else}
                    <div class = "imageBox">
                        <Image src = "/{image.imagePath}" 
                        mainLink = "/posts/{image.uploadDate}" 
                         ></Image>
                    </div>
                {/if}
            {/each}
        {/if}
        </div>
        <PageNav currentPage={data.pagination.currentPage} totalPages = {data.pagination.pageCount} baseUrl = {baseUrl}/>
    </div>
    <div class = "footerSpacer"></div>
</div>

<style>
    .midContainer{
        display:grid;
        height:100%;
        align-self: stretch;
    }

    .footerSpacer{
        height: 30px;
    }
    
    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 1fr 4fr;
        }

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
        gap:10px;
        width: 100%;
    }

    .imageBox{
        position: relative;
        width: 100%;
        overflow:hidden;
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