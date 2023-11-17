<script>
    import Image from "./image.svelte";
    import { onMount } from 'svelte';


    export let images = ["test", "test", "test", "test"];
    export let spacing = 20;
    export let imgWidth = 10; // Unsure I actually need this but we will see

    let loading = true;
    let container;
    const breakpointRange = [.75, 1.5] //images that fall in range set to 1:1 ratio, Faster way of checking?  
    const columnBlockWidth = 300;
    let columnWidth;
    let columns;
    let currColumns; 
    let gaps;


    function calculateColumns() {
        let containerWidth = loading ? 900 : container.clientWidth;
        columns = Math.floor(containerWidth / (imgWidth + spacing));
        console.log(containerWidth, columns, loading);
    }

    function generateGrid2() {
        let colIndex = 0; 
        let rowIndex = 0;
        let lastImage = images.length - 1;
        let i = 0;
        let grid = [];

        while( i < images.length){
            let childElement = "<img src={images[i]} />";
            if (!grid[rowIndex]) grid[rowIndex] = [];
            grid[rowIndex][colIndex] = childElement;

            // Increase index and row/column counters
            i++;
            colIndex++;
            if (colIndex > 2) {
                colIndex = 0;
                rowIndex++;
            }
        }

        return grid;
    }
    
    function generateGrid() {
        grid = [];

        let x = spacing;
        let y = spacing;

        for (let i = 0; i < images.length; i++) {
            let position = `top:${y}px;left:${x}px`;
            grid.push({ src: images[i], position });

            if ((i + 1) % columns === 0) {
            x = spacing;
            y += imgWidth + spacing;
            } else {
            x += imgWidth + spacing;
            }
        }
    }


    let promise = calculateColumns();

    onMount(() => {
        loading = false;
        calculateColumns();
        window.addEventListener('resize', calculateColumns);

    });

</script>

<div class="waterfallContainer" style="position:relative" bind:this={container}>
    {#each grid as item}
        <div class="placeholder" style="{item.position}">
        <img src="{item.src}" style="width:{imgWidth}px">
        </div>
    {/each}
    </div>

    <style>
    .waterfallContainer {
        position: relative;
    }
    .placeholder {
        position: absolute;
    }
  </style>