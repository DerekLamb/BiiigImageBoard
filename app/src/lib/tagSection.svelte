<script>
    import Tag from "./tag.svelte";
    export let tags  = ["test","test", "test"];
    export let edit = true;
</script>


    <div class="TagSection">
        <h3>Tags</h3>
            <div class="tags-input">
            <ul>
                {#each tags as tag }
                    <Tag tag = {tag} edit = {edit}></Tag>
                {/each}
            </ul>
            {#if edit}
                <input type="text">
            {/if}
            </div>
            {#if edit}
                <button>Edit</button>
            {/if}

    </div>
    
<style>
    .TagSection{
        display: grid;
        grid-template-rows: 2rem 1fr;

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