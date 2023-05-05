<script>
import Image from "$lib/image.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";

/** @type {import('./$types').PageData} */ 
export let data;


function calculateNextPrevPages() {
    const numImages = Number(data.lengthNum);
    const numImageParam = (numImages === 30 || !numImages) ? "" : `&len=${numImages}`;
    const nextPage = (data.currPage > 1) ? `/posts?page=${data.currPage - 1}${numImageParam}` : null;
    const prevPage = (data.currPage < data.pageNum) ? `/posts?page=${data.currPage + 1}${numImageParam}` : null;
    return {
      nextPage: nextPage,
      prevPage: prevPage
    }
  }

  const { nextPage, prevPage } = calculateNextPrevPages();

// const numImages = Number(data.lengthNum);
// const numImageParam = (numImages === 30 || !numImages) ? "" : `&len=${numImages}`;
// const nextPage = `/posts?page=${data.currPage - 1}${numImageParam}`;
// const prevPage = `/posts?page=${data.currPage + 1}${numImageParam}`;
console.log(nextPage + '/n' + prevPage);
</script>

<div class = midContainer>
    <SideBar>
        <SearchBar />
        <TagSection />
    </SideBar>
    <div class = "imageBrowser">
        <div class = "pgnumCont">
            <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            <a href={prevPage} class="pageNum">&gt&gt&gt</a>
        </div>
        <div class = "imageCont">
        {#each data.images as image}
            <Image src = "/{image.imagePath}" link = "/posts/{image.genName}" imageName = {image.name} maxHeight = "150px" width = "80px"></Image>
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
    
    @media (min-width:767px) {

        .midContainer{
            grid-template-columns: 1fr 5fr;
            grid-template-areas:
            "sidebar main";
        }
    }
    .imageBrowser{
        background-color: #9ac7d6;
        border: 2px solid #65ccc744;
        border-radius: 8px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.205);
        display:flex;
        flex-wrap:wrap;
        flex-grow: 1;
    }
    .imageCont{
        display:flex;
        flex-wrap:wrap;
        margin: 0 .5% 0;
        
    }
    .pgnumCont{
        margin: 12px;
        width:100%;
    }
    .pageNum{
        width:100%;
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;

    }
    .pageNum:link{
        color: #808080;
    }
    .pageNum:visited{
        color: #808080;
    }
    .pageNum:hover{
        color: #FFCEB0;
        transition:.2s;
    }
</style>