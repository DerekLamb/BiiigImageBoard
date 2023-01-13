<script>
	import Tag from "./tag.svelte";

    let response = [{name: "Enderman", link:"https://www.google.com"},{name: "Enderman", link:"www.google.com"},{name: "Enderman", link:"www.google.com"},{},{}];
    // Get response and bulid tags based on response
    // Using a  test response for now
    // calculate common tags?
</script>

<ul >
    {#each response as tag }
        <Tag name = {tag.name} link = {tag.link}></Tag>
    {/each}
</ul>

<style>
    ul{
        padding: 10px 10px 10px 10px;
        background-color: rgb(213, 213, 252);
        max-height: 5%;
    }
</style>
