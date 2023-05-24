<script>
    import Image from "$lib/image.svelte";
    import TagSection from "$lib/tagSection.svelte";
    import SideBar from "$lib/sideBar.svelte";
    import SearchBar from "$lib/searchBar.svelte";
    import MasonryLayout from "$lib/waterfallLayout.svelte";
    import { onMount, beforeUpdate } from "svelte";
    
    /** @type {import('./$types').PageData} */ 
    export let data;




    console.log(...data.images);

</script>
    <MasonryLayout images = {data.images} >

    </MasonryLayout>

<style>

</style>