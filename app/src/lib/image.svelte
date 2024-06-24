<script>
    import { afterUpdate } from 'svelte';

    export let src = '';
    export let alt = "TestAlt";
    export let imageName = "";
    export let thumbnail = false;
    export let upScore = -1;
    export let downScore = -1;
    export let leftLink = "";
    export let rightLink = "";
    export let mainLink = "";

    let imgClass = thumbnail ? "thumbnail" : "full-img";
    let imgElement;
    let imageStatus = 'loading';

    afterUpdate(() => {
        if (imgElement) {
            if (imgElement.complete) {
                imageStatus = imgElement.naturalWidth === 0 ? 'error' : 'loaded';
            } else {
                imageStatus = 'loading';
                imgElement.onload = () => {
                    imageStatus = 'loaded';
                };
                imgElement.onerror = () => {
                    imageStatus = 'error';
                };
            }
        }
    });

    function handleClick(event) {
        if (mainLink !== "") {
            window.location.href = mainLink;
            return;
        }
        const bounds = event.target.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        if (x < bounds.width / 2) {
            window.location.href = leftLink;
        } else {
            window.location.href = rightLink;
        }
    }
</script>

<div class="container">
    
    <img 
    bind:this={imgElement} 
    class="{imgClass}" 
    src={src} alt={alt} 
    on:click={handleClick} 
    style="display: {imageStatus === 'loaded' ? 'block' : 'none'};"/>

    {#if imageStatus !== 'loaded'}
        <div class="placeholder" on:click={handleClick}>
            <span>{imageName.charAt(0).toUpperCase()}</span>
        </div>
    {/if}

    <span class = "imgName">{imageName}</span>

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

    .container img {
        width: 100%; 
        height: auto; 
        object-fit: cover;
        border-radius: 4px;
        min-width: 88 px;
        min-height: 78 px;
        display: block;
        overflow: hidden;
    }

    .placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2em;
        color: #345D7E;
        border-radius: 4px;
    }

    .loading {
        background-color: #e0e0e0;
        font-size: 1em;
    }

    .container span {
        display: block;
        overflow: hidden; 
        white-space: nowrap; 
        text-overflow: ellipsis; 
        font-size: 1em; 
        margin-top: 8px; 
    }

</style>