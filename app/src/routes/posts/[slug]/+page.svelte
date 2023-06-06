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
</script>

<div class = midContainer>
    <SideBar>
        <SearchBar></SearchBar>
        <TagSection editable = {true} tags = {tags} imageID = {data.image.genName}></TagSection>
        <PromptSection items = {data.image.embPrompt}></PromptSection>
    </SideBar>
    <div class="imageWindow">
        <Image width = "40vw" src = "../../{data.image.imagePath}" imageName={data.image.name} link = "/{data.image.imagePath}"></Image>
        <div class="imageInfo">
            <p>{data.image.name}</p>
            <p>{data.image.fsName}</p>
            <p>{data.image.imagePath}</p>
<!-- 
            <table>
                <tbody>
                  {#each embPrompt as item}
                    <tr>
                      <td>{item},</td>
                    </tr>
                  {/each}
                </tbody>
              </table> -->

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
        gap:25px;
        height:100%;
        align-self: stretch;
    }
    @media (min-width:767px) {

        .midContainer{
            grid-template-columns: 12rem 1fr;
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

    table tbody{
        width: 100%;
        border-collapse: collapse;
        overflow-y: scroll;
        height: 200px;
    }

    td {
        padding: 8px;
        border: 1px solid #ddd;
    }
</style>