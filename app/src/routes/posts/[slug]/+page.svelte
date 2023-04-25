<script>
    import ImageBrowser from "$lib/imageBrowser.svelte"
    import Tagbar from "$lib/tagbar.svelte";
    import NavBar from "$lib/navBar.svelte";
	import Image from "$lib/image.svelte";
	import { redirect } from "@sveltejs/kit";
    


    /** @type {import('./$types').PageData} */ 
    export let data;
    let tags = (data.image.tags.length > 0) ? data.image.tags : "NA";
</script>

<div class = midContainer>
    <Tagbar response = {tags}>
    </Tagbar>
    <div class="imageWindow">
        <Image width = "100%" src = "../../{data.image.imagePath}" imageName={data.image.name} link = "/{data.image.imagePath}"></Image>
        <div class="imageInfo">
            <p>{data.image.name}</p>
            <p>{data.image.fsName}</p>
            <p>{data.image.imagePath}</p>
            {#each tags as tag }
                <p>{tag}</p>
            {/each}
            
            <form method="Post" action="?/delete">
                <button type="submit">Delete</button>
                <input type="hidden" name="imageName" value="{data.image.genName}">
                <input type="hidden" name="fileName" value="{data.image.imagePath}">
            </form>
    

        </div>
        <div>
            
            <p>Comments</p>
            <div class = "imageWindow"> Here be comments</div>
            <div class = "imageWindow"> Here be comments</div>
            <div class = "imageWindow"> Here be comments</div>
            <div class = "imageWindow"> Here be comments</div>
        </div>
    </div>
   

</div>

<style>

    .midContainer{
        display:grid;
        gap:40px;
        height:100%;
        padding: 10px;
    
    }
    @media (min-width:767px) {

        .midContainer{
            grid-template-columns: min-content, 1fr;
            grid-template-areas:
            "sidebar main";
        }
    }
    .imageWindow{
        background-color: #9ac7d6;
        border: 2px solid #65ccc744;
        border-radius: 8px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.205);

        display:flex;
        flex-wrap:wrap;
        flex-grow: 1;
    }
</style>