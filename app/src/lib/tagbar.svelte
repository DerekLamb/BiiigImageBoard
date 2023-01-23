<script>
	import Tag from "./tag.svelte";

    let response = [{name: "Enderman", link:"https://www.google.com"},{name: "Enderman", link:"www.google.com"},{name: "Enderman", link:"www.google.com"},{},{}];
    // Get response and bulid tags based on response
    // Using a  test response for now
    // calculate common tags?
</script>

<ul>
    <p>Tags</p>
    {#each response as tag }
        <Tag name = {tag.name} link = {tag.link}></Tag>
    {/each}
</ul>

<style>
    p{
        size: 20%;
        margin:0;
    }
    ul{
        padding: 10px 10px 10px 10px;
        background-color: #45542d;
        max-height: 5%;
        margin: 0 .5% 0;
        border-radius: 5px;
    }
</style>
