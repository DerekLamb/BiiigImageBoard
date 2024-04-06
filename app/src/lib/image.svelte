
<script>
    export let src = '';
    export let alt = "TestAlt";
    export let imageName = "";
    export let link = "TestLink";
    export let thumbnail = false;
    export let upScore = -1;
    export let downScore = -1;
    let imgClass = "full-img"
    if(thumbnail){
        imgClass="thumbnail";
    }
</script>

<div class="container">
    <a href={link}> <img class="{imgClass}" src={src} alt={alt}/> </a>
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

    .container a {
        display: block; /* Makes the anchor behave like a block, containing the image and text */
        text-align: center; /* Centers the content */
        color: inherit; /* Optional, ensures the title inherits the text color from the parent */
        text-decoration: none; /* Removes underline from links */
        max-width: 100%; /* Ensures it doesn't grow beyond the parent container */
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