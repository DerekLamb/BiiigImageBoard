<script>
    import Image from "$lib/image.svelte";
    import Tagbar from "$lib/tagbar.svelte";
    import { page } from '$app/stores';
	import NavBar from "$lib/navBar.svelte";

    /** @type {import('./$types').PageData} */ 
    export let data;
    let url = $page.url;
    
</script>

<div class = midContainer>
    <Tagbar ></Tagbar>
    <div class = "imageBrowser">
        <div class = "pgnumCont">
            <a href="/posts?page={data.currPage - 1}"class="pageNum">&lt&lt&lt</a>
            <a href="/posts?page={data.currPage - -1}" class="pageNum">&gt&gt&gt</a>
        </div>
        <div class = "imageCont">
        {#each data.images as image}
            <Image src = "/{image.imagePath}" link = "/posts/{image.genName}" imageName = {image.name} maxHeight = "180px"></Image>
        {/each}
        </div>
        <div class = "pgnumCont">
            <a href="/posts?page={data.currPage - 1}"class="pageNum">&lt&lt&lt</a>
            <a href="/posts?page={data.currPage - -1}" class="pageNum">&gt&gt&gt</a>
        <!-- {#each Array(data.pageNum) as _, i }
            <a href="/posts?page={i+1}" class="pageNum">{i+1}</a>
        {/each} -->
        </div>
    </div>
        
</div>

<style>
    .midContainer{
        display:grid;
        grid-template-columns: min-content, 1fr;

        gap:40px;
        height:100%;
        padding: 10px;
    
        grid-template-areas:
            "sidebar main";
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