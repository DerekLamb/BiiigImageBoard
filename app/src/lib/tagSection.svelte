<script>
    import AutoTagInput from "./autoTagInput.svelte";
    import Tag from "./tag.svelte";
    import { onMount } from 'svelte';

    export let imageTags = {};
    export let imageID = '';
    export let editable = true;

    let autoTags = ["test","test", "test"];
    let editing = false;

    onMount(() => {
        fetchTags();
    });


    async function fetchTags() {
        try {
            const response = await fetch(`/api/tags`);
            if (response.ok) {
                const data = await response.json();
                autoTags = data;
                //console.log(autoTags);
            } else {
                throw new Error('Failed to fetch tags');
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    }


    function handleMessage(event) {
        console.log(event.detail);
        const newTag = event.detail.tag.toLowerCase().trim().replace(/ /g,"_");;
        if (newTag !== "") {
            imageTags = imageTags ? [...imageTags, newTag] : [newTag];
            updateServerTags();
            }
    }

    function handleDeleteTag(event){ 
        imageTags = imageTags.filter((tag) => tag !== event.detail.deletedTag);
        updateServerTags()
    }

    async function updateServerTags() {
        try {
            const response = await fetch(`/api/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags : imageTags , imageID: imageID})
                });

            if (!response.ok) {
                throw new Error('Failed to send data to the server');
                }
            
        } catch (error) {
        console.error(error);
        }
    }

</script>
    <div class="TagSection">
        <h3>Tags</h3>
            <div class="tagsContainer">
                <ul>
                    {#if imageTags}
                        {#each imageTags as tag }
                            <Tag tag = {tag} edit = {editing} on:message = {handleDeleteTag} ></Tag>
                        {/each}
                    {:else}
                        <p>Page left blank on purpose</p>
                    {/if}        
                </ul>
                {#if editing}
                <div class="inputContainer">
                    <AutoTagInput autocompleteTags={autoTags} on:tag = {handleMessage} />
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