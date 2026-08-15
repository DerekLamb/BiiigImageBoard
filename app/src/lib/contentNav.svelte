<script lang='ts'>
import { browser } from "$app/environment";

    let {
        prevId = "",
        nextId = "",
        contentName = "",
        baseUrl = "/",
        queryParams = {},
        }: {
        prevId?: string;
        nextId?: string;
        contentName?: string;
        baseUrl?: string;
        queryParams?: Record<string, string>;
    } = $props();

let prevUrl = $state("");
let nextUrl = $state("");

function buildUrl(contentId: string) {
    if (!browser) return "";
    const url = new URL(baseUrl + contentId, window.location.origin);
    for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
    }
    return url.toString();
}

$effect(() => {
    prevUrl = buildUrl(prevId);
    nextUrl = buildUrl(nextId);
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