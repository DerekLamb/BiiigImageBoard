
<script>
    export const size = "default";
    export let src = '';
	export let alt = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let imageName = "";
    export let link = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let thumbnail = false;
	export let width = "100%";
    export let maxHeight = "100%";
    let upScore = 1
    let downScore = 1
    let imgClass = "full-img"
    if(thumbnail){
        imgClass="thumbnail";
    }
</script>

<div class="image-container" style={`width: ${width}`}>
    <a href={link}> <img class="{imgClass}" src={src} alt={alt} style={`max-height: ${maxHeight}; width:{width};`} /> </a>
    {#if upScore == -1 && downScore == -1}
        <div class = "metadata">
            <div class = "imgName " style = "width:{width}">{imageName}</div>
        </div>
    {:else}
        <div class = "metadata">
            <p class = "imgName">{imageName}</p>
            <p class = "score">{upScore} &#x1F446 {downScore} &#x1F447 </p>
        </div>
    {/if}
    
</div>

<style>
    .image-container{
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
    }
</style>