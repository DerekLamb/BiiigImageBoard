<script>
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    export let imageID = ''
    export let editable = true;
    let editing = false;

    function handleKeyDown(event) {
    if (event.key === "Enter") {
        const newTag = event.target.value.trim();
        if (newTag !== "") {
            tags = [...tags, newTag];
            sendTagsToBackend();
            event.target.value = "";
            }
        }
    }

    function handleDeleteTag(event){ 
        tags = tags.filter((tag) => tag !== event.detail.deletedTag);
        sendTagsToBackend()
    }

    async function sendTagsToBackend() {
    try {
      const response = await fetch(`/api/tags?image_id=${imageID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags : tags , imageID: imageID})
        });

      if (!response.ok) {
        throw new Error('Failed to send data to the server');
        }
      // Do something with success response
    } catch (error) {
      console.error(error);
      // Handle error
    }
    }

</script>


    <div class="TagSection">
        <h3>Tags</h3>
            <div class="tagsContainer">
            <ul>
                {#each tags as tag }
                    <Tag tag = {tag} edit = {editing} on:message = {handleDeleteTag} ></Tag>
                {/each}
            </ul>
            {#if editing}
                <input class = "tagInput" id="tagInput" type="text" placeholder="Type tag here" on:keydown = {handleKeyDown} autofocus>
            {/if}
            </div>
        
        {#if editable}   
            <button on:click = {() => {editing = !editing;}}>Edit</button>
        {/if}
    </div>
    
<style>
    .TagSection{
        display: grid;
        grid-template-rows: 2rem 2fr 1.5rem 1.5rem 1.5rem 1fr;
        background-color: #d6f8ef;
        border-radius: 15px;
    }

    .TagSection h3{
        font-family: 'Montserrat', sans-serif;
        margin:.2rem;
        text-align:center;
    }

    ul{
        width: inherit;
        box-sizing: border-box; 
        display:flex;
        flex-direction: column;
        align-items: stretch;
        padding: 0px;
        margin: 2px;
    }

    .tagsContainer{
        display:flex;
        flex-direction: column;
        align-items: stretch;
    }

    .tagInput{
        font-size:16px;
        width:85%;
        font-family: 'Montserrat', sans-serif;
        background: #b4e7d6;
        outline: none;
        border: none;
        border-radius: 6px;
        padding-left: 5%;
        margin-left: 5%;
    }
    
</style>