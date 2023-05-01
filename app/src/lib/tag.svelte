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
    <button class = 'tag-close-icon' on:click={deleteTagMessage}>x</button>
    {/if}

</li>

<style>
    .tag {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        color: #fff;
        font-size: 1rem;
        list-style: none;
        border-radius: 6px;
        margin-bottom: 5px;
        padding: 0 8px;
        background: #9ac7d6;
    }
    .tag:hover{ 
        color: #5e725e;
        transition: .2s;
    }
    .tag-title{
        flex: 5;
    }
    .tag-close-icon{
        justify-self: flex-end;
    }
    li{
        font-family: 'Montserrat', sans-serif;
        text-decoration: none;
    }

    a{
        color: #fff;
        text-decoration: none;
        padding-right: 10px;
    }
    a:hover{
        color: #5e725e;
        transition: .2s;
    }
</style>