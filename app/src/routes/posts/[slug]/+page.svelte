<script lang=ts>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import Image from "$lib/image.svelte";



/** @type {import('./$types').PageData} */ 
export let data;
let tags = data.image?.tags ?? [];
let embPrompt = data.image?.embPrompt ?? [];

function copyItems() {
      const copyText = embPrompt.join(",");
      navigator.clipboard.writeText(copyText);
    }

</script>

<div class = midContainer>

    <SideBar itemCount = {3}>
        <SearchBar></SearchBar>
        <form method="get" action="/posts">
            <button type="submit" class="returnBtn">return to browse</button>
            <input type="hidden" name="imageId" value="{data.image._id}">
        </form>
        <TagSection editable = {true} imageID = {data.image?._id} imageTags = {tags}></TagSection>
    </SideBar>

    <div class="imageWindow">
        <Image src = "../../{data.image?.imagePath}"  
            leftLink = {data.adjacents?.next?.uploadDate}
            rightLink = {data.adjacents?.prev?.uploadDate}>
        </Image>
        <div class="pageNumContainer">
            {#if data.adjacents?.next != null}
            <a href="/posts/{data.adjacents.next.uploadDate}" class="pageNum" id="prev">&lt&lt&lt</a>
            {/if}
            <span id="imageName">{data.image?.originalName}</span>
            {#if data.adjacents?.prev != null}
            <a href="/posts/{data.adjacents.prev.uploadDate}" class="pageNum" id ="next">&gt&gt&gt</a>
            {/if}
        </div>
        <div class="groupNumContainer">
            {#if data.adjacents?.next != null}
            <a href="/posts/{data.adjacents.next.uploadDate}" class="pageNum" id="prev">&lt&lt&lt</a>
            {/if}
            <span id="imageName">{data.image?.originalName}</span>
            {#if data.adjacents?.prev != null}
            <a href="/posts/{data.adjacents.prev.uploadDate}" class="pageNum" id ="next">&gt&gt&gt</a>
            {/if}
        </div>
        <div class="imageInfo">
            <p><span>Image Name: </span>{data.image?.originalName}</p>
            <p><span>Filename: </span>{data.image?.sanitizedFilename}</p>
            <p><span>File Location: </span>{data.image?.imagePath}</p>
            <p><span>Image Id:</span>{data.image?._id}</p>
            {#if embPrompt.length != 0}
                <div>embeddedPrompt:
                    <p>
                        {#each embPrompt as item}
                            
                            <span>{item},</span>
                            
                        {/each}
                    </p>
                </div>
                <button on:click={copyItems}>Copy Prompt</button>
            {/if}

            <form method="post" action="?/delete">
                <button type="submit">Delete Image</button>
                <input type="hidden" name="strId" value="{data.image?._id}">
                {#if data.adjacents?.next != null}
                <input type="hidden" name="next" value="{data.adjacents.next.uploadDate}">
                {/if}
                {#if data.adjacents?.prev != null}
                <input type="hidden" name="prev" value="{data.adjacents.prev.uploadDate}">
                {/if}
            </form>
    

        </div>
        <div>
            
            <p>Comments</p>
            <div class = "imageWindow">{data.image?.group}</div>
            <div class = "imageWindow"> Here be comments</div>
            <div class = "imageWindow"> Here be comments</div>
            <div class = "imageWindow"> Here be comments</div>
        </div>
    </div>
   

</div>

<style>

    .midContainer{
        display:grid;
        gap:60px;
        height:100%;
        align-self: stretch;
    }
    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 200px 1fr;
        }
    }

    .returnBtn{
        width: 100%;
        height: 100%;
    }

    .imageWindow{
        background-color: #9ac7d6;

        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
        display:flex;
        flex-wrap:wrap;
        flex-grow: 1;
    }

    .pageNum{
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;
        color: #5b5b5b;
    }

    .pageNumContainer{
        margin: 2 12px;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr, 1fr, 1fr;
        grid-template-rows: auto;
        grid-template-areas:
            "prev title next"
    }

    #prev {
        justify-self: start;
    }
    #next {
        justify-self: end;
    }

    #imageName {
        justify-self:center
    }

    @media (max-width: 768px){
        .pageNum{
            font-size: 1.5rem;
            margin: 0;
        }
        .pageNumContainer{
            margin: 2px 12px;
        }
    }

    span {
        padding: 8px;
        border: 2px solid #ddd;
    }
</style>