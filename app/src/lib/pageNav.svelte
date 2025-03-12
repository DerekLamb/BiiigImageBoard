<script lang="ts">
    import { browser } from "$app/environment"

    export let currentPage = 1;
    export let totalPages = 1;
    export let baseUrl  = '';
    export let queryParams = {};
    export let size = "unused?"


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


</script>


<nav class="pagination {size}" aria-label="Pagination">
    <a href={firstPage} class="pagination-item" aria-label="First page">
        $laquo;
    </a>
    <a href={currentPage > 1 ? prevPage : null} class="pagination-item" aria-label="Previous page" aria-disabled={ currentPage <= 1} >
        $lsaquo;
    </a> 
    <span class="page-nav-info">Page {currentPage} / {totalPages}</span>

    <a href={currentPage < totalPages ? nextPage : null} class="pagination-item" aria-label="Next page" aria-disabled = { currentPage >= totalPages} >
        $rsaquo;
    </a>
    <a href={lastPage} class="pagination-item" aria-label="Last page">
        $raquo;
    </a>
</nav>

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