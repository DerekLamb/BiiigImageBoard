
<script>
    export const size = "default";
	export let src = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let imageName = "";
    export let link = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
	// export let height;
	export let width = "100px";
    export let maxHeight = "100%";
    let upScore = -1
    let downScore = -1
    // margin calculated based on viewport width
</script>

<div class = "imgContainer">
    <a href={link} style="max-height:{maxHeight}"><img {src} alt = "Err" style = "width:{width}"></a>
    {#if upScore == -1 && downScore == -1}
<div class = "imgName" style = "width:{width}">{imageName}</div>
{:else}
<div class = "imgName" style = "width:{width}">{imageName}</div>
<span class = "score">{upScore} ^ {downScore} v</span>
{/if}

</div>

<style>
    .imgContainer{
        display:flex;
        flex-direction: column;
        margin: 15px;
        color: white;
        border-radius: 10px; /* set the border radius for the container */
        overflow: hidden; /* hide the sharp corners of the image */
        box-shadow: 5px -5px 10px rgba(0, 0, 0, 0.3);
        filter:opacity(90%);
    }
    img{
        border-radius: 10px;
        min-width: 65px;
        min-height: 120px;
        filter: blur(0px);
    }

    .imgContainer a{
        overflow:hidden
    }
    .imgName {
        padding: 2px 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipse;
    }
    .score{
        color:white;
    }
</style>