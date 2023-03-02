
<script>
import Image from "./image.svelte";

export let images = [{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1}];
// export let images
// structure is [{imgdata: xx, imgname: xx, imgthumb: xx, imgpage: xx}, ...]

</script>

<div class = "imageBrowser">
    {#each images as image}
        <Image link = image.imgPage  image = image.imgData ></Image>
        <!-- <Image > </Image > -->
    {/each}
</div>

<style>
    .imageBrowser{
        display:flex;
        flex-wrap: wrap;
        min-width: 100px; 
        min-height: 20px;

        background-color: lightgreen
    }
</style>