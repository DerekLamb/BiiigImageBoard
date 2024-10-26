<script lang="ts">
    import { writable } from 'svelte/store'; // Import only if you need to create a store inside the component

    // Props
    export let label: string = 'Length';
    export let options: any[] = [];  // The options for the select dropdown
    export let selectedValue : any;       // Bindable store or a local variable from the parent

</script>

<span>{label}
    <select bind:value={selectedValue}>
        {#each options as option}
            <option value={option}>{option}</option>
        {/each}
    </select>
</span>

<style>
    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #5b5b5b;
    }

    select {
        font-family: 'Montserrat', sans-serif;
        font-size: 17px;
        appearance: none;
        color: #345D7E;
        background-color: #f7d1d7;
        border:none;
        border-radius: 7px;
    }
</style>