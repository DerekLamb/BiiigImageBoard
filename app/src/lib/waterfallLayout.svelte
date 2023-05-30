<script>
	import { GridFSBucket } from "mongodb";
    import Image from "./image.svelte";
    import { onMount } from 'svelte';


    export let images = [];
    export let spacing = 20;
    export let imgWidth = 0; // Unsure I actually need this but we will see

    const container = document.querySelector('.waterfallContainer');
    const breakpointRange = [.75, 1.5] //images that fall in range set to 1:1 ratio, Faster way of checking?  
    const columnBlockWidth = 300;
    let grid
    let columnWidth;
    let columns:[number];
    let gaps;


    function calculateColumns() {
        let containerWidth = container.clientWidth;
        let columnCount = Math.floor(containerWidth / columnBlockWidth);
        let columns = new Array(columnCount).fill(0);
        let columnWidth = (containerWidth - (columnCount + 1) * spacing) / columnCount;
        let gaps = new Array(columnCount).fill(spacing);
    }

    function generateGrid() {
        while(imgLeft){ //Don't like the name but can't beat it right now 
            
        }
    }
    
    let promise = calculateColumns();

     onMount(() => {
        window.addEventListener('resize', calculateColumns);
     });

</script>

<div class="waterfallContainer" style="position:relative" bind:this={container}>
    {#await calculateColumns()}
    <p>...waiting</p>
    {:then columns} 
    <p>{columns}</p>
    {/await}
    <img src="" alt="Err">
</div>

<style>
    .waterfallContainer {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -5px;
    }

</style>