
<script>
import Image from "./image.svelte";

export let images = [{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1},{test:-1}];

for (let i = 0; i > 100; i++){
    images.push({test:i});
}
console.log(images)

</script>

<div class = "imageBrowser">
    {#each images as image}
        <Image ></Image>
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