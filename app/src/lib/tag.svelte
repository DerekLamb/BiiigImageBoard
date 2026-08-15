<script lang="ts">
    let { tag = "", edit = false, onDelete } = $props();
</script>

<li class = "tag">
    {#if !edit}
    <span class = 'span-minus'><a href="/posts?search=-{tag}">-</a></span>   
    {/if}
    <span class = 'tag-title'><a href="/posts?search={tag}">{tag}</a></span>   
    {#if edit}
    <div class = 'delete-flex'>
        <button class = 'tag-close-icon' onclick={() => onDelete?.(tag)}>x</button>
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
        margin: 5px 10px;
        background-color: #FFAB73;
    }
    .tag:hover{ 
        color: #725e5e;
        background-color:#fab689;
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

    .tag-close-icon { 
        display:inline;
        background-color: #00000000;
        color: #c90000;
        border: none;
        cursor: pointer;
        margin: 0 3px;
        font-size: 1rem;
    }

    .delete-flex{
        display:flex;
        flex: 1;
        justify-content: flex-end;
        align-items: center;
    }
</style>