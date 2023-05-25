<script>
    import Image from "$lib/image.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import SearchBar from "$lib/searchBar.svelte";
    import { onMount, beforeUpdate } from "svelte";
	import { construct_svelte_component } from "svelte/internal";
    
    /** @type {import('./$types').PageData} */ 
    export let data;

    let containerWidth;
    let columns = [10, 10];
    let columnWidth;
    let gap = 5;

    function calculateColumns() {
        const columnCount = Math.floor(containerWidth / 300);
        console.log(containerWidth);
        // columns = new Array(columnCount).fill(0);
        console.log("got here");
        columnWidth = (containerWidth - (columnCount + 1) * 5) / columnCount;
        
        return {columns, columnWidth}
    }
    
    let promise = calculateColumns();

    // console.log(...data.images);

</script>
    <div class="waterfallContainer" style="position:relative" bind:clientWidth={containerWidth}>
        {#await promise}
        <p>...waiting</p>
        {:then grid} 
        <p>{grid.columns}</p>
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