<script lang=ts>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import Image from "$lib/image.svelte";
import ContentNav from "$lib/contentNav.svelte";



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
        <form id="desktopButton" method="get" action="/posts">
            <button type="submit" class="returnBtn">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
            </button>
            <input type="hidden" name="imageId" value="{data.image._id}">
        </form>
        <TagSection editable = {true} imageID = {data.image?._id} imageTags = {tags}></TagSection>
    </SideBar>

    <div class="imageWindow">
        <Image src = "../../{data.image?.imagePath}"  
            leftLink = {data.adjacents?.next?.uploadDate}
            rightLink = {data.adjacents?.prev?.uploadDate}>
        </Image>
        <ContentNav baseUrl={"/posts/"} contentName={data.image?.originalName} prevId={data.adjacents?.prev?.uploadDate} nextId={data.adjacents?.next?.uploadDate} />
        {#if false}
        <ContentNav baseUrl={"/posts"} contentName={data.image.group} prevId={data.adjacents.next.uploadDate} nextId={data.adjacents?.next?.uploadDate}/>    
        {/if}
        <div class="pageNumContainer" id="mobileButton">
            <form class="mobileButton" method="get" action="/posts">
                <button type="submit" class="returnBtn">
                    <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path style="fill:#030303;" d="M102.496,45.204h-2.499v-0.012l-77.613-0.368l32.958-32.959l-8.277-8.28L0,50.65l47.882,47.889 l8.28-8.28l-33.719-33.73l71.642,0.346v0.04h8.417c23.151,0,41.993,18.838,41.993,41.997c0,23.151-18.842,41.992-41.993,41.992H0 v11.711h102.496c29.613,0,53.703-24.09,53.703-53.703C156.199,69.293,132.109,45.204,102.496,45.204z"/></svg>
                </button>
                <input type="hidden" name="imageId" value="{data.image._id}">
            </form>
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

    #mobileButton{
            display:block;
            height: 50px;
            padding: 10px;
        }

    #mobileButton>form{
        height:100%;
    }

    .returnBtn {
        background: none;
        border: none;
        outline: none;
        width: 100%;
        height: 100%;
        background: #f7d1d7;
        border-radius:25px;
    }

    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 200px 1fr;
        }

        #mobileButton{ 
        display:none;
        }


    }
    
    @media (max-width: 768px){
        .pageNumContainer{
            margin: 2px 12px;
        }
    }

    .imageWindow{
        background-color: #9ac7d6;

        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.205);
        display:flex;
        flex-wrap:wrap;
        flex-grow: 1;
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



    span {
        padding: 8px;
        border: 2px solid #ddd;
    }
</style>