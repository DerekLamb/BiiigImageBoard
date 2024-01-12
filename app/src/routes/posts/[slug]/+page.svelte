<script>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import Image from "$lib/image.svelte";
import PromptSection from "$lib/promptSection.svelte";
import { redirect } from "@sveltejs/kit";


/** @type {import('./$types').PageData} */ 
export let data;
let tags = (data.image.tags) ? data.image.tags : [];
let embPrompt = (data.image.embPrompt) ? data.image.embPrompt : [];

function copyItems() {
      const copyText = embPrompt.join(",");
      navigator.clipboard.writeText(copyText);
    }
</script>

<div class = midContainer>
    <SideBar>
        <SearchBar></SearchBar>
        <TagSection editable = {true} tags = {tags} imageID = {data.image.genName}></TagSection>
    </SideBar>
    <div class="imageWindow">
        <Image src = "../../{data.image.imagePath}" imageName={data.image.name} link = "/{data.image.imagePath}"></Image>
        <div class="imageInfo">
            <p><span>ImageName: </span>{data.image?.originalName}</p>
            <p><span>Filename: </span>{data.image?.sanitizedFilename}</p>
            <p><span>FileLocation: </span>{data.image?.imagePath}</p>
            {#if embPrompt.length != 0}
                <div>embeddedPrompt:
                    <p>
                        {#each embPrompt as item}
                            <span>
                            <td>{item},</td>
                            </span>
                        {/each}
                    </p>
                </div>
                <button on:click={copyItems}>Copy Prompt</button>
            {/if}

            <form method="Post" action="?/delete">
                <button type="submit">Delete Image</button>
                <input type="hidden" name="originalName" value="{data.image?.originalName}">
                <input type="hidden" name="sanitizedFilename" value="{data.image?.sanitizedFilename}">
                <input type="hidden" name="thumbnailPath" value="{data.image?.thumbnailPath}">
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
        align-self: stretch;
    }
    @media (min-width:960px) {

        .midContainer{
            grid-template-columns: 200px 1fr;
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

    td {
        padding: 8px;
        border: 1px solid #ddd;
    }
</style>