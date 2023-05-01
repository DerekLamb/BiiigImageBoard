<script>
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    let editable = true;

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
    
    function deleteTag(index) {
    tags = tags.filter((_, i) => i !== index);
    // delete tag from backend
    console.log(`Deleting tag at index ${index} from backend`);
    }

    function handleDeleteTag(event){ 
        tags = tags.filter((tag) => tag !== event.detail.deletedTag);
    }


</script>


    <div class="TagSection">
        <h3>Tags</h3>
            <div class="tags-input">
            <ul>
                {#each tags as tag }
                    <Tag tag = {tag} edit = {editable} on:message = {handleDeleteTag} ></Tag>
                {/each}
            </ul>
            {#if editable}
                <input type="text" on:keydown={handleKeyDown}>
            {/if}
            </div>

        <button on:click ={() => editable = !editable}>Edit</button>
        {#if editable}
            <button on:click = { () => console.log("testing this out ")}>Save</button>
        {/if}
    </div>
    
<style>
    .TagSection{
        display: grid;
        grid-template-rows: 2rem 2fr 25px 25px 25px 2fr;

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
    .tags-input{
        padding-left:10px;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: 80%;
    }
</style>