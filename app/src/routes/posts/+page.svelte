<script>
    import Image from "$lib/image.svelte";
    import Tagbar from "$lib/tagbar.svelte";
    import { page } from '$app/stores';
	import NavBar from "$lib/navBar.svelte";

    /** @type {import('./$types').PageData} */ 
    export let data;
    let url = $page.url;
    
</script>

<h1>b..d</h1>
<p>Yeah... </p>
<NavBar></NavBar>
<div class = midContainer>
    <Tagbar ></Tagbar>
    <div class = "imageBrowser">
        {#each data.images as image}
            <Image src = "../../{image.imagePath}" link = {$page.url}/{image.genName} imageName = {image.name}></Image>
        {/each}
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
    h1{
        color:azure;
    }
    p{
        color:azure;
    }
</style>