<script lang="ts">
    import { onMount, beforeUpdate } from "svelte";

    export let currPage : number;
    export let numPages :number;

    let nextPage: string | null = null;
    let prevPage: string | null = null;
    let firstPage: string | null = null;
    let lastPage: string | null = null;

    const calculatePages = () => {
        const url = new URL(window.location.href);;

        const createPageUrl = (url :URL , pageNumber : number) => {
            url.searchParams.set("page", pageNumber.toString());
            return url.toString();
        };

        nextPage = currPage < numPages ? createPageUrl(url, currPage + 1) : null;
        console.log(currPage);
        prevPage = currPage > 1 ? createPageUrl(url, currPage - 1) : null;
        lastPage = createPageUrl(url, numPages);
        url.searchParams.delete("page")
        firstPage = url.toString();

    };

    onMount(() => {
        calculatePages();
    });

    beforeUpdate(() => {
        calculatePages();
    });

</script>

<div class = "pgnumCont">
    <div class="prevPageCont">
        <a href={firstPage} class="pageNum">&lt&lt/</a>
        <a href={prevPage} class="pageNum">&lt&lt&lt</a>
    </div>
    <div class="nextPageCont">
        <a href={nextPage} class="pageNum">&gt&gt&gt</a>
        <a href={lastPage} class="pageNum">\&gt&gt</a>
    </div>
</div>

<style>
    .pgnumCont{
        margin: 12px;
        width: 100%;
        display: flex;
        justify-content: space-around;
    }

    .pageNum{
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
</style>