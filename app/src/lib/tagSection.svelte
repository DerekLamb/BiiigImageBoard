<script>
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    export let imageID = ''
    let editable = false;

    function addTag(tag) {
    // send tag to backend
    console.log(`Adding tag ${tag} to backend`);
    }

    function handleKeyDown(event) {
    if (event.key === "Enter") {
        const newTag = event.target.value.trim();
        if (newTag !== "") {
            tags = [...tags, newTag];
            addTag(newTag);
            event.target.value = "";
            }
        }
    }
    
    async function updateTags(event) {
        event.preventDefault();

        try {
        // send a POST request to the server with the user input as the payload
        const response = await fetch('?/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'tags':tags, 'genImage': genImage }),
        });

        // throw an error if the response status is not in the 200-299 range
        if (!response.ok) {
            throw new Error('Error submitting form');
        }

        // show a success message if the request was successful
        alert('Form submitted successfully!');
        
        } catch (error) {
        // show an error message if the request failed
        alert(`Error: ${error.message}`);
        }
    };

    function handleDeleteTag(event){ 
        tags = tags.filter((tag) => tag !== event.detail.deletedTag);
    }

    async function sendDataToBackend() {
    try {
      const response = await fetch(`/api/tags?image_id=${imageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tags)
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
                    <Tag tag = {tag} edit = {editable} on:message = {handleDeleteTag} ></Tag>
                {/each}
            </ul>
            {#if editable}
                <input class = "tagInput" type="text" on:keydown={handleKeyDown}>
            {/if}
            </div>

        <button on:click ={() => editable = !editable}>Edit</button>
        {#if editable}
            
            <button on:click = {updateTags}>Save</button>
        {/if}
    </div>
    
<style>
    .TagSection{
        display: grid;
        grid-template-rows: 2rem 2fr 1.5rem 1.5rem 1.5rem 1fr;

        background-color: #c9e1ea;
        border-radius: 5px;
    }
    .TagSection h3{
        font-family: 'Montserrat', sans-serif;
        margin:.2rem;
        text-align:center;
    }
    ul{ 
        width:100%;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0px;
        margin: 0px;
    }
    .tagsContainer{
        padding-left:10px;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: 80%;
    }
</style>