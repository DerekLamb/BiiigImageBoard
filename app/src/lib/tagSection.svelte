<script>
    import AutoTagInput from "./autoTagInput.svelte";
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    export let imageID = '';
    export let editable = true;
    //export let embPrompt = [];
    let editing = false;

    function handleKeyDown(event) {
    if (event.key === "Enter") {
        const newTag = event.target.value.trim().replace(/ /g,"_");;

        if (newTag !== "") {
            tags = tags ? [...tags, newTag] : [newTag];
            sendTagsToBackend();
            event.target.value = "";
            }
        }
    }

    function handleMessage(event) {
        console.log(event.detail);
        const newTag = event.detail.tag.trim().replace(/ /g,"_");;
        if (newTag !== "") {
            tags = tags ? [...tags, newTag] : [newTag];
            sendTagsToBackend();
            }
    }

    function handleDeleteTag(event){ 
        tags = tags.filter((tag) => tag !== event.detail.deletedTag);
        sendTagsToBackend()
    }

    async function sendTagsToBackend() {
    try {
      const response = await fetch(`/api/tags`, {
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
                    {#if tags}
                        {#each tags as tag }
                            <Tag tag = {tag} edit = {editing} on:message = {handleDeleteTag} ></Tag>
                        {/each}
                    {:else}
                        <p>No tags...</p>
                    {/if}        
                </ul>
                {#if editing}
                <div class="inputContainer">
                    <AutoTagInput autocompleteTags={["test","teest", "teeest"]} on:tag = {handleMessage} />
                </div>
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
        width: 100%;
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    .tagsContainer{
        display:flex;
        flex-direction: column;
        align-items: flex-start;
    }
    
    .inputContainer{
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
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