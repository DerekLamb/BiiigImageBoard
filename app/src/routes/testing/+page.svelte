<script>
import { onMount } from 'svelte';


/** @type {import('./$types').PageData} */ 
export let data;

// const images = [
//     {
//     src: '/path/to/image1',
//     width: 300,
//     height: 400
//     },
//     {
//     src: '/path/to/image2',
//     width: 400,
//     height: 600
//     },
//     {
//     src: '/path/to/image3',
//     width: 500,
//     height: 800
//     }
// ];
  
    let containerWidth;
    let columns;
    let columnWidth;
    let gaps;
  
    function calculateLayout() {
      const container = document.querySelector('.waterfall-container');
      containerWidth = container.clientWidth;
      const columnCount = Math.floor(containerWidth / 300);
      columns = new Array(columnCount).fill(0);
      columnWidth = (containerWidth - (columnCount + 1) * 5) / columnCount;
      gaps = new Array(columnCount).fill(5);
    }
  
    onMount(() => {
      calculateLayout();
      window.addEventListener('resize', calculateLayout);
    });
  
    function getMinIndex(array) {
      return array.indexOf(Math.min(...array));
    }
  </script>
  
  <div class="waterfall-container" style="position: relative;">
    {#each images as image, i}
      <img
        src={image.src}
        alt={`Image ${i}`}
        style="
          position: absolute;
          left: {columns[getMinIndex(columns)]}px;
          top: {Math.min(...columns)}px;
          width: {columnWidth}px;
          height: auto;
        "
      />
      {#await new Promise(r => setTimeout(r, 0))}
        <div class="placeholder" style="height: {image.height * (columnWidth / image.width)}px;" />
      {:then}
        {#if i === images.length - 1}
          <div class="placeholder" style="height: {Math.max(...columns) + gaps[0]}px;" />
        {/if}
        {#each columns as column, j}
          {#if j === getMinIndex(columns)}
            {#await new Promise(r => setTimeout(r, 0))}
              <div class="placeholder" style="height: {image.height * (columnWidth / image.width) + gaps[j]}px;" />
            {:then}
              {#if i !== 0 || j !== 0}
                {gaps[j] = 5;}
              {/if}
              {columns[j] += image.height * (columnWidth / image.width) + gaps[j];}
            {/await}
          {:else}
            {gaps[j] = 5;}
          {/if}
        {/each}
      {/await}
    {/each}
  </div>
  
  <style>
    .waterfall-container {
      display: flex;
      flex-wrap: wrap;
      margin: 0 -5px;
    }
  
    .placeholder {
      background-color: #eee;
      margin: 5px;
    }
  </style>