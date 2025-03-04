<script>
    import { createEventDispatcher } from 'svelte';

    export let src = '';
    export let alt = "TestAlt";
    export let imageName = "";
    export let thumbnail = false;
    export let upScore = -1;
    export let downScore = -1;
    export let leftLink = "";
    export let rightLink = "";
    export let mainLink = "";
    export let selectable = false; // Add selectable mode

    const dispatch = createEventDispatcher();
    
    let imgClass = "full-img"
    if(thumbnail){
        imgClass="thumbnail";
    }

    function handleClick(event) {
        // If in selectable mode, prevent navigation and dispatch select event
        if(selectable) {
            event.preventDefault();
            dispatch('select', { imageName, src });
            return;
        }
        
        // Normal navigation behavior
        if(mainLink != "") {
            window.location.href = mainLink;
            return;
        }
        const bounds = event.target.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        if (x < bounds.width / 2) {
            window.location.href = leftLink; // Navigate to left link
        } else {
            window.location.href = rightLink; // Navigate to right link
        }
    }

</script>

<div class="container">
    
    <img class="{imgClass}" src={src} alt={alt} on:click={handleClick}/>
    {#if upScore == -1 && downScore == -1}
            <span class = "imgName ">{imageName}</span>
    {:else}
            <span class = "imgName">{imageName}</span>
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

    .container img {
        width: 100%; /* Makes the image responsive, scales with the width of the parent */
        height: auto; /* Keeps the image aspect ratio */
        object-fit: cover;
        border-radius: 4px;
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