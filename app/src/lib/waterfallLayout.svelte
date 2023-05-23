<script>
import Image from "./image.svelte";
export let images = [];


let containerWidth;
    let columns;
    let columnWidth;
    let gaps;
  
</script>

<div class="waterfallContainer" style="position:relative">
    <img src="{images[0]}" alt="Err">
</div>

<style>
    .waterfallContainer {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -5px;
    }

</style>