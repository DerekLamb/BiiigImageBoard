<script>
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    export let imageID = '';
    export let editable = true;
    //export let embPrompt = [];
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

        <!-- {#if embPrompt}
            <h3>Embedded Prompt</h3>
            <div class="tagsContainer">
                <ul>
                    {#each embPrompt as tag }
                        <Tag tag = {tag} edit = {false} on:message = {handleDeleteTag} ></Tag>
                    {/each}
                </ul>
            </div>
        {/if} -->
    </div>
    
<style>
    .TagSection{
        display: grid;
        grid-template-rows: 2rem minmax(120px, auto) 1.5rem 1.5rem 1.5rem 1fr;
        background-color: #FFFFFF;
        border-radius: 15px;
        justify-content: center;
        width: 230px;
    }

    .TagSection h3{
        font-family: 'Montserrat', sans-serif;
        margin:.2rem;
        text-align:center;
    }

    ul{
        width: inherit;
        display:flex;
        flex-direction: column;
        height:auto;
        padding: 0px;
        margin: 2px;
    }

    .tagsContainer{
        display:flex;
        flex-direction: column;
        align-items: start;
    }

    .tagInput{
        font-size:18px;
        width: 190px;
        font-family: 'Montserrat', sans-serif;
        background: #E06C75;
        outline: none;
        border: none;
        border-radius: 6px;
        padding-left: 10px;
        margin: 0 20px 10px 10px;
    }
    
    button{
        font-size:16px;
        font-family: 'Montserrat', sans-serif;
        color:#fafafa;
        background: #7c3036;
        outline: none;
        border: none;
        border-radius: 6px;
        width:200px;
        margin: 0 20px 0 10px;
    }
    
</style>