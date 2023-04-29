<script>
    export let tag = "test";
    export let edit = false;
</script>

<li class = "tag">
    {#if !edit}
    <span class = 'span-minus'><a href="{tag}">-</a></span>   
    {/if}
    <span class = 'tag-title'><a href="{tag}">{tag}</a></span>   
    {#if edit}
    <span class = 'tag-close-icon' >x</span>
    {/if}

</li>

<style>
    .tag {
        width: auto;
        height: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
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