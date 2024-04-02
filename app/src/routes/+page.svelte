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
        width:1200px;
        max-width:70%;
        height: 800px;
        background-color: #2B4F81;
        display:flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        border-radius: 10px;
    }

    .Home * {
        margin: 100px;
    }

    h3{
        font-size: 57px;
        margin: 0px 180px 10px;
        font-family: 'Orbitron', sans-serif;
        color:#ffecef;
    }
</style>