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
            <a href="/posts?page={data.currPage - 1}"class="pageNum">prev</a>
            <a href="/posts?page={data.currPage - -1}" class="pageNum">next</a>
        </div>
        <div class = "imageCont">
        {#each data.images as image}
            <Image src = "/{image.imagePath}" link = "/posts/{image.genName}" imageName = {image.name} maxHeight = "180px"></Image>
        {/each}
        </div>
        <div class = "pgnumCont">
            <a href="/posts?page={data.currPage - 1}"class="pageNum">prev</a>
            <a href="/posts?page={data.currPage - -1}" class="pageNum">next</a>
        <!-- {#each Array(data.pageNum) as _, i }
            <a href="/posts?page={i+1}" class="pageNum">{i+1}</a>
        {/each} -->
        </div>
    </div>
        
</div>

<style>
    :global(body){
        background-color: #6c6c6c;
    }
    .midContainer{
        display:flex;
        min-height:100%;
    }
    .imageBrowser{
        background-color: #45542d;
        display:flex;
        flex-wrap:wrap;
        margin: 0 .5% 0;
        border-radius: 5px;
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
        color: white;
    }
    .pageNum:visited{
        color: white;
    }
    .pageNum:hover{
        color:lightgreen;
        transition:.2s;
    }
</style>