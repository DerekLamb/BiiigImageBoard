<script lang=ts>
import SearchBar from "$lib/searchBar.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import Image from "$lib/image.svelte";
import ContentNav from "$lib/contentNav.svelte";
import ReturnButton from '$lib/returnButton.svelte';
import { onDestroy, onMount, tick } from "svelte";
import { writable } from "svelte/store";


/** @type {import('./$types').PageData} */ 
export let data;
let tags = data.image?.tags ?? [];
let embPrompt = data.image?.embPrompt ?? [];
let imageYScroll = 0;

function copyItems() {
      const copyText = embPrompt.join(",");
      navigator.clipboard.writeText(copyText);
    }



</script>

<svelte:window bind:scrollY={imageYScroll} />

<div class = midContainer>

    <SideBar itemCount = {3}>
        <SearchBar></SearchBar>
        <ReturnButton contentId = {data.image?._id}/>
        <TagSection editable = {true} imageID = {data.image?._id} imageTags = {tags}></TagSection>
    </SideBar>
    <div class="imageWindow">
        <ContentNav baseUrl={"/posts/"} contentName={data.image?.originalName} prevId={data.adjacents?.prev?.uploadDate} nextId={data.adjacents?.next?.uploadDate} />

        <Image src = "../../{data.image?.imagePath}"  
            leftLink = {data.adjacents?.prev?.uploadDate}
            rightLink = {data.adjacents?.next?.uploadDate}>
        </Image>
        <ContentNav baseUrl={"/posts/"} contentName={data.image?.originalName} prevId={data.adjacents?.prev?.uploadDate} nextId={data.adjacents?.next?.uploadDate} />
        {#if false}
        <ContentNav baseUrl={"/posts"} contentName={data.image.group} prevId={data.adjacents.next.uploadDate} nextId={data.adjacents?.next?.uploadDate}/>    
        {/if}
        <div class="pageNumContainer" id="mobileButton">
            <ReturnButton contentId = {data.image?._id}/>
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