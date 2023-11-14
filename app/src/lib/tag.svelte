<script>
	import { createEventDispatcher } from "svelte";

    export let tag = "";
    export let edit = false;

    const dispatch = createEventDispatcher();

    function deleteTagMessage() {
        dispatch('message', {
            deletedTag: tag
        })
    }
</script>

<li class = "tag">
    {#if !edit}
    <span class = 'span-minus'><a href="{tag}">-</a></span>   
    {/if}
    <span class = 'tag-title'><a href="{tag}">{tag}</a></span>   
    {#if edit}
    <div class = 'delete-flex'>
        <button class = 'tag-close-icon' on:click={deleteTagMessage}>x</button>
    </div>
    
    {/if}

</li>

<style>
    .tag {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        color: #fff;
        font-size: 20px;
        list-style: none;
        border-radius: 6px;
        margin: 0 50px 5px 20px;
        background-color: #E06C75;

    }
    .tag:hover{ 
        color: #725e5e;
        background-color:#ff6666;
        transition: .2s;
    }

    .tag span{
        padding-left: 10px

    }
    li{
        font-family: 'Montserrat', sans-serif;
        text-decoration: none;
    }

    a{  width:100%;
        color: #2D2D2D;
        text-decoration: none;
        padding-right: 10px;
    }
    
    a:hover{
        color: #5e725e;
        transition: .2s;
    }

    button {
        color: red;
    }
    .tag-close-icon { 
        display:inline;
        background-color: #b4e7d6;
        color: #162524;
        border: none;
        cursor: pointer;
        margin: 0 5px;
        font-size: 1rem;
    }

    .delete-flex{
        display:flex;
        flex: 1;
        justify-content: flex-end;
        align-items: center;
    }
</style>