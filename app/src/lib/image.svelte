<script lang="ts">
import { goto } from '$app/navigation';

export let src = '';
export let alt = "TestAlt";
export let thumbnail = false;
export let upScore = -1;
export let downScore = -1;
export let leftLink = "";
export let rightLink = "";
export let mainLink = "";



let imgClass = thumbnail ? "thumbnail" : "full-img"

let imgElement:Element;

function handleClick(event:MouseEvent) {

    // Normal navigation behavior
    if(mainLink != "") {
        goto(mainLink);
        return;
    }

    if(imgElement){
        const bounds = imgElement.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const targetLink = x < bounds.width/2 ? leftLink : rightLink

        if(targetLink) goto(targetLink, { noScroll: true })
    
        return
    }


}
</script>

<div class="container">
    <a href={mainLink || "#"}>
        <img class="{imgClass}" src={src} alt={alt} bind:this={imgElement} on:click|preventDefault={handleClick} />
    </a>
    {#if upScore != -1 && downScore != -1}
            <span class = "score">{upScore} &#x1F446 {downScore} &#x1F447 </span>
    {/if}
    
</div>

<style>

    .container {
        width: 100%; 
        box-sizing: border-box;
        padding: 4px;
        display:flex;
        flex-direction: column;
        border-radius: 5px;
    }

    .container img {
        width: 100%; /* Makes the image responsive, scales with the width of the parent */
        height: auto; /* Keeps the image aspect ratio */
        object-fit: cover;
        border-radius: 5px;
    }

    .container span {
        display: block; /* Ensures the title appears on a new line below the image */
        overflow: hidden; /* Ensures the text doesn't overflow the container */
        white-space: nowrap; /* Keeps the title in a single line */
        text-overflow: ellipsis; /* Adds an ellipsis if the title is too long */
        font-size: 1em; /* Adjust as needed */
        margin-top: 8px; /* Space between the image and the title */
    }

</style>