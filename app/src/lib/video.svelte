<script>
	import { goto } from '$app/navigation';
import { createEventDispatcher } from 'svelte';

export let src = '';
export let thumbnail = false;
export let upScore = -1;
export let downScore = -1;

const dispatch = createEventDispatcher();

let imgClass = "full-img"
if(thumbnail){
    imgClass="thumbnail";
}

function handleClick(event) {
    // If in selectable mode, prevent navigation and dispatch select event
    // if(selectable) {
    //     event.preventDefault();
    //     dispatch('select', { imageName, src });
    //     return;
    // }
    
    // Normal navigation behavior
    if(mainLink != "") {
        goto(mainLink);
        return;
    }

    const bounds = event.target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const targetLink = x < bounds.width/2 ? leftLink : rightLink
    if(targetLink) goto(targetLink, {noScroll: true})
    return
}

function handleKey(event) {
    //eventually bubble up for keyboard nav
    console.log(event.key);
    return
}

</script>

<div class="container">
        <video controls>
            <source {src} type="video/mp4">
            <source {src} type="video/webm">
            Your browser doesn't support videos
        </video>
    {#if upScore != -1 && downScore != -1}
            <span class = "score">{upScore} &#x1F446 {downScore} &#x1F447 </span>
    {/if}
    
</div>

<style>

    .container {
        width: 100%; 
        padding: 3px;
        box-sizing: border-box;
        display:flex;
        flex-direction: column;
        border-radius: 5px;
        color: #345D7E;
    }

    .container video {
        max-height: 80vh;
        max-width: 100%;
        display: block;
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