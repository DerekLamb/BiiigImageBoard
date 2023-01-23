<script>
    import ImageBrowser from "$lib/imageBrowser.svelte"
    import Tagbar from "$lib/tagbar.svelte";
    import NavBar from "$lib/navBar.svelte";
	import Image from "$lib/image.svelte";
    
    /** @type {import('./$types').PageData} */ 
    export let data;
</script>

<h1>b..d</h1>
<p>Yeah... </p>
<NavBar></NavBar>
<div class = midContainer>
    <Tagbar ></Tagbar>
    <Image width = "100%" src = "../../{data.image.imagePath}" imageName={data.image.name}></Image>
</div>

<style>
    :global(body){
        background-color: #6c6c6c;
    }
    .midContainer{
        display:flex;
    }
</style>