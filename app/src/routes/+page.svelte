<script>
import ImageBrowser from "$lib/imageBrowser.svelte";
import SearchBar from "$lib/searchBar.svelte";
import Tagbar from "$lib/tagbar.svelte"
    
    //set tag to specific size or move based on screen size
    //decide image browser size 
</script>

<div class = midContainer>
    
    <div class="Home">
        <h3>biiig image board</h3>
        <SearchBar></SearchBar>
        <div class="placeholder"> Placeholder for carousel</div>
    </div>
</div>

<style>

    .midContainer{
        display:flex;
        flex-direction: row;
        justify-content: center;
        width:100%;
        height: 800px;

    }

    .Home{
        width: 80%;
        height: 800px;
        background-color: #94ddcaa2;
        display:flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        border-radius: 0px;
    }

    .Home * {
        margin: 100px;
    }

    h3{
        font-size: 57px;
        margin: 0px 180px 10px;
        font-family: 'Orbitron', sans-serif;
        color:#162524;
    }
</style>