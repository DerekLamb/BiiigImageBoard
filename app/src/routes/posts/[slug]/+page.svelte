<script>
    import ImageBrowser from "$lib/imageBrowser.svelte"
    import Tagbar from "$lib/tagbar.svelte";
    import NavBar from "$lib/navBar.svelte";
	import Image from "$lib/image.svelte";
    
    /** @type {import('./$types').PageData} */ 
    export let data;
</script>

<div class = midContainer>
    <Tagbar ></Tagbar>
    <Image width = "100%" src = "../../{data.image.imagePath}" imageName={data.image.name} link = "/{data.image.imagePath}"></Image>
    <form method="Post" action="?/delete">
        <button type="submit">Delete</button>
        <input type="hidden" name="imageName" value="{data.image.genName}">
        <input type="hidden" name="fileName" value="{data.image.imagePath}">
    </form>
</div>

<style>
    :global(body){
        background-color: #6c6c6c;
    }
    .midContainer{
        display:flex;
    }
</style>