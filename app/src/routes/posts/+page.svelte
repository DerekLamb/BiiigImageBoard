<script>
    import Image from "$lib/image.svelte";
    import Tagbar from "$lib/tagbar.svelte";
    import { page } from '$app/stores';

    /** @type {import('./$types').PageData} */ 
    export let data;
    let url = $page.url;
    
</script>

<h1>b..d</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<div class = midContainer>
    <Tagbar ></Tagbar>
    <div class = "imageBrowser">
        {#each data.images as image}
            <Image src = "../../{image.imagePath}" link = {$page.url}/{image.fsName} ></Image>
        {/each}
    </div>
</div>
<style>
    :global(body){
        background-color: rgb(10, 10, 10);
    }
    .midContainer{
        display:flex;
    }
</style>