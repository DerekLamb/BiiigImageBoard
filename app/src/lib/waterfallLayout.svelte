<script>
    import Image from "./image.svelte";
    export let images = [];
    export let spacing = 20;
    export let imgWidth = 0;

    function calculateLayout() {
        const container = document.querySelector('.waterfall-container');
        containerWidth = container.clientWidth;
        const columnCount = Math.floor(containerWidth / 300);
        columns = new Array(columnCount).fill(0);
        columnWidth = (containerWidth - (columnCount + 1) * 5) / columnCount;
        gaps = new Array(columnCount).fill(5);
    }
</script>

<div class="waterfallContainer" style="position:relative">
    
    <img src="{}" alt="Err">
</div>

<style>
    .waterfallContainer {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -5px;
    }

</style>