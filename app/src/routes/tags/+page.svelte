<script>
    import { onMount } from 'svelte';

    let tagList = [];

    onMount(() => {
        fetch('/api/tags')
            .then(res => res.json())
            .then(data => {
                tagList = data;
            });
    });

    // $: document.title = `#${tagList}`;

</script>

<div>Tags Here</div>


<style>
    
</style>