
<script>
    export const size = "default";
    export let src = '';
	export let alt = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let imageName = "";
    export let link = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let thumbnail = false;
	export let width = "200px";
    export let maxHeight = "100%";
    let upScore = 1
    let downScore = 1
    let imgClass = "full-img"
    if(thumbnail){
        imgClass="thumbnail";
    }
</script>

<div class="container" style={`width: ${width}`}>
    <a href={link}> <img class="{imgClass}" src={src} alt={alt} style={`max-height: ${maxHeight}; width:${width};`} /> </a>
    {#if upScore == -1 && downScore == -1}
            <div class = "imgName " style = "width:{width}">{imageName}</div>
    {:else}
            <span class = "imgName">{imageName}</span>
            <span class = "score">{upScore} &#x1F446 {downScore} &#x1F447 </span>
    {/if}
    
</div>

<style>

    .container {
        width: 100%; /* or any other max-width */
        padding: 10px; /* Optional, for some spacing around the link */
        box-sizing: border-box; /* Ensures that padding is included in the width */
        display:flex;
        flex-direction: column;
        background-color: #162524;
        color: white;
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
        max-width: 100%; /* Ensures the image does not grow beyond its natural size */
    }

    .container span {
        display: block; /* Ensures the title appears on a new line below the image */
        overflow: hidden; /* Ensures the text doesn't overflow the container */
        white-space: nowrap; /* Keeps the title in a single line */
        text-overflow: ellipsis; /* Adds an ellipsis if the title is too long */
        font-size: 1em; /* Adjust as needed */
        margin-top: 8px; /* Space between the image and the title */
    }

    /* .image-container{
        box-sizing: border-box;
        display:flex;
        flex-direction: column;
        align-items: center;
        background-color: #162524;
        font-family: 'Montserrat', sans-serif;
        padding: 2px; 
        filter:opacity(90%);
    }

    .full-img {
        object-fit: contain;
        filter: blur(0px);
        width: 100%;
        height: auto;
    }

    .thumbnail{
        width:17vw;
    }

    .image-container a{
        overflow:visible;
    }
    
    .metadata { 
        width: 100%;
    }

    .imgName {
        display:block;
        font-size: 1.15rem;
        background-color: #d6f8ef;
        margin: 5px 0 0 0;
        padding: 4px 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .score{
        margin: 0;
        font-size: 1.15rem;
        padding: 5px 15px;
        background-color:#d6f8ef;
        color:#162524;
    } */
</style>