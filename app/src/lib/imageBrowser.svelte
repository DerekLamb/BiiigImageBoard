<script lang="ts">
    export let minSize = 200;
</script>

<div class="imageGrid" style = "grid-template-columns: repeat(auto-fit, minmax({minSize}px, 1fr)">
    <slot />
</div>

<style>
    .imageGrid {
        display: grid;
        gap: 20px;
    }


</style>