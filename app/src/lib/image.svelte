
<script>
    export const size = "default";
	export let src = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let imageName = "";
    export let link = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
	// export let height;
	export let width = "75px";
    let upScore = -1
    let downScore = -1
    // margin calculated based on viewport width
</script>

<div class = "imgContainer">
<a href={link}><img {src} alt = "Err" style = "width:{width}"></a>
{#if upScore == -1 && downScore == -1}
<div class = "imgName" style = "width:{width}">{imageName}</div>
{:else}
<div class = "imgName" style = "width:{width}">{imageName}</div>
<span>{upScore} ^ {downScore} v</span>
{/if}

</div>

<style>
    img{
        min-width: 65px;
        min-height: 100px;
        
    }
    .imgContainer{
        display:flex;
        flex-direction: column;
        margin: 15px;
        color: white;
    }
    .imgName {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipse;
    }
    span{
        color:white;
    }
</style>