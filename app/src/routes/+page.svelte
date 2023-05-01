<script>
import ImageBrowser from "$lib/imageBrowser.svelte";
import Tagbar from "$lib/tagbar.svelte"
    
    //set tag to specific size or move based on screen size
    //decide image browser size 
</script>

<div class = midContainer>
    <Tagbar ></Tagbar>
    <ImageBrowser></ImageBrowser>
</div>

<style>
    .midContainer{
        display:flex;
    }
</style>