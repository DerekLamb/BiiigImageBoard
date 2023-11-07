<script>
import Image from "$lib/image.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";
import { onMount, beforeUpdate } from "svelte";

/** @type {import('./$types').PageData} */ 
export let data;

let nextPage = null;
let prevPage = null;

function calculateNextPrevPages() {
    const numImages = Number(data.lengthNum);
    const numImageParam = (numImages === 24 || !numImages) ? "" : `&len=${numImages}`;
    nextPage = (data.currPage > 1) ? `/posts?page=${data.currPage - 1}${numImageParam}` : null;
    prevPage = (data.currPage < data.pageNum) ? `/posts?page=${data.currPage + 1}${numImageParam}` : null;
  }

onMount(() => {
    calculateNextPrevPages();
    });

beforeUpdate(() => {
    calculateNextPrevPages();
    });

</script>

<div class = midContainer>
    <SideBar>
        <SearchBar />
        <TagSection editable={false}/>
    </SideBar>
    <div class = "imageBrowser">
        <div class = "pgnumCont">
            <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            <a href={prevPage} class="pageNum">&gt&gt&gt</a>
        </div>
        <div class = "imageCont">
        {#each data.images as image}
            {#if image.thumbPath}
                <div class = "imageBox">
                    <Image src = "/{image.thumbPath}" link = "/posts/{image.genName}" imageName = {image.name} maxHeight = "480px" width = "17vw" thumbnail=true></Image>
                </div>
            {:else}
                <div class = "imageBox">
                    <Image src = "/{image.imagePath}" link = "/posts/{image.genName}" imageName = {image.name} maxHeight = "480px" width = "17vw"></Image>
                </div>
            {/if}
        {/each}
        </div>
        <div class = "pgnumCont">
            <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            <a href={prevPage} class="pageNum">&gt&gt&gt</a>
        <!-- {#each Array(data.pageNum) as _, i }
            <a href="/posts?page={i+1}" class="pageNum">{i+1}</a>
        {/each} -->
        </div>
    </div>
        
</div>

<style>
    .midContainer{
        display:grid;
        gap:40px;
        height:100%;

    }
    
    @media (min-width:820px) {
        .midContainer{
            grid-template-columns: 2fr 9fr;
            grid-template-areas:
            "sidebar main";
        }
    }

    .imageBrowser{
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
    }

    .imageCont{
        display: grid;
        grid-template-columns:  repeat( auto-fit, minmax(17vw, 3fr));
        gap: 10px;
        width: 100%;
    }
    .imageBox{ 
        overflow:hidden;
        padding: 8px;
    }
    .pgnumCont{
        margin: 12px;
        width: 100%;
    }

    .pageNum{
        width: 100%;
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;
        color: #808080;

    }

    .pageNum:link{
        color: #808080;
    }

    .pageNum:visited{
        color: #808080;
    }

    .pageNum:hover{
        color: #7bb7a2;
        transition:.2s;
    }
</style>