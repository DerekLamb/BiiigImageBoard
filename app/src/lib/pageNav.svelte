<script lang="ts">
    import { browser } from "$app/environment"
    import { onMount, beforeUpdate } from "svelte"

    export let currentPage = 1;
    export let totalPages = 1;
    export let baseUrl  = '';
    export let queryParams = {};
    export let length = 24;
    export let size = "unused?"
    export let pageText = "Page";


    let nextPage: string | null = null;
    let prevPage: string | null = null;
    let firstPage: string | null = null;
    let lastPage: string | null = null;


    function buildUrl(page: number) {

        if(!browser){
            console.log("no browser available");
            return "";
        }

        const url = new URL(baseUrl, window.location.origin);
        
        for (const [key, value] of Object.entries(queryParams)){ //curious how to set type here... TODO 
            url.searchParams.set(key, value);
        }

        url.searchParams.set('page', page.toString())
        url.searchParams.set('len', length.toString());
        return url.toString();
    };


    function updateUrls() {
        if (browser) {
            firstPage = buildUrl(1);
            lastPage = buildUrl(totalPages);
            prevPage = currentPage > 1 ? buildUrl(currentPage - 1) : '';
            nextPage = currentPage < totalPages ? buildUrl(currentPage + 1) : '';
        }
    }


    onMount(() => {
        updateUrls();
    });

    beforeUpdate(() => {
        updateUrls();
    });

</script>


<nav class="pagination {size}" aria-label="Pagination">
    <a href={currentPage <= 1 ? null : firstPage} class="pagination-item" aria-label="First page" aria-disabled={ currentPage <= 1}>
        &laquo;
    </a>
    <a href={currentPage > 1 ? prevPage : null} class="pagination-item" aria-label="Previous page" aria-disabled={ currentPage <= 1} >
        &lsaquo;
    </a> 
        <span class="page-nav-info">{pageText} {currentPage} / {totalPages}</span>
    <a href={currentPage < totalPages ? nextPage : null} class="pagination-item right" aria-label="Next page" aria-disabled = { currentPage >= totalPages} >
        &rsaquo;
    </a>
    <a href={currentPage >= totalPages ? null : lastPage} class="pagination-item right" aria-label="Last page">
        &raquo;
    </a>
</nav>

<style>
    .pagination{
        margin: 12px;
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
    }

</style>