<script lang='ts'>
import { browser } from "$app/environment";
import { onMount, beforeUpdate } from "svelte"

export let prevId = "";
export let nextId = "";
export let contentName = "";
export let baseUrl = "/";
export let queryParams = {};

let prevUrl = "";
let nextUrl = "";

function buildUrl(contentId: string) {
    
    if(!browser){
            return "";
        }
    
    const urlRoute = baseUrl + contentId;
    console.log(contentId);
    const url = new URL(urlRoute, window.location.origin);

    for (const [key, value] of Object.entries(queryParams)){ //curious how to set type here... TODO 
            url.searchParams.set(key, value);
    }

    return url.toString();
}


onMount(() => {
        prevUrl = buildUrl(prevId);
        nextUrl = buildUrl(nextId)
    });

    beforeUpdate(() => {
        prevUrl = buildUrl(prevId);
        nextUrl = buildUrl(nextId)
    });



</script>



<div class="pagination">
    <a href="{prevId ? prevUrl : null}" class="pagination-item" id="prev" data-sveltekit-noscroll>&lt&lt&lt</a>
    <span id="contentName">{contentName}</span>
    <a href="{nextId ? nextUrl : null}" class="pagination-item right" id ="next" data-sveltekit-noscroll>&gt&gt&gt</a>
</div>

<style>
    .pagination{
        margin: 12px 0px;
        width: 100%;
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    .pagination-item{
        width: 100%;
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;
        color: #808080;
    }

    .pageNum:link, .pageNum:visited{
        color: #345D7E;
    }

    .pageNum:hover{
        color: #7bb7a2;
        transition:.2s;
    }

    .right {
        text-align: right;
    }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #5b5b5b;
        width: 100%;
        text-align: center;
    }

</style>