<script>
    import Image from "./image.svelte";
    import { onMount } from 'svelte';
    export let images = [];
    export let spacing = 20;
    export let imgWidth = 0;


    let containerWidth;
    let columns;
    let adjustRatios = [1.5, .75] //element aspect ratio snap points for fitting
    let columnWidth;
    let gaps;
    let container;

    function calculateColumns() {
        containerWidth = 200;
        const columnCount = Math.floor(containerWidth / 300);
        columns = new Array(columnCount).fill(0);
        columnWidth = (containerWidth - (columnCount + 1) * 5) / columnCount;
        gaps = new Array(columnCount).fill(5);
    }
    
    let promise = calculateColumns();

     onMount(() => {
         promise = calculateColumns();
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