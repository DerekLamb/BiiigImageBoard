<script lang="ts">
    import { browser } from "$app/environment"
    import { goto } from "$app/navigation"
    import { onMount, beforeUpdate } from "svelte"

    export let currentPage = 1;
    export let totalPages = 1;
    export let baseUrl  = '';
    export let queryParams = {};
    export let length = 24;
    export let size = "unused?"
    export let pageText = "Page";
    export let jumps: number[] = [10, 100]; // multi-page jump steps


    let nextPage: string | null = null;
    let prevPage: string | null = null;
    let firstPage: string | null = null;
    let lastPage: string | null = null;
    let prevJumpUrls: Record<number, string | null> = {}; // step -> url
    let nextJumpUrls: Record<number, string | null> = {}; // step -> url
    let gotoInput: string = '';


    function buildUrl(page: number) {

        if(!browser){
            console.log("no browser available");
            return "";
        }

        const url = new URL(baseUrl, window.location.origin);

        // Preserve the current query string (search term, excluded tags, any
        // filters) so navigation stays within the active search scope.
        for (const [key, value] of new URLSearchParams(window.location.search)) {
            url.searchParams.set(key, value);
        }

        for (const [key, value] of Object.entries(queryParams)){ //curious how to set type here... TODO 
            url.searchParams.set(key, value);
        }

        url.searchParams.set('page', page.toString())
        url.searchParams.set('len', length.toString());
        return url.toString();
    };


    // Clamp a target page to [1, totalPages] and resolve its URL.
    function goTo(page: number): string | null {
        const p = Math.min(totalPages, Math.max(1, page));
        return buildUrl(p);
    }

    function updateUrls() {
        if (browser) {
            firstPage = goTo(1);
            lastPage = goTo(totalPages);
            prevPage = currentPage > 1 ? goTo(currentPage - 1) : null;
            nextPage = currentPage < totalPages ? goTo(currentPage + 1) : null;
        }
    }

    function updateJumps() {
        prevJumpUrls = {};
        nextJumpUrls = {};
        if (!browser) return;
        for (const step of jumps) {
            prevJumpUrls[step] = currentPage - step >= 1 ? goTo(currentPage - step) : null;
            nextJumpUrls[step] = currentPage + step <= totalPages ? goTo(currentPage + step) : null;
        }
    }

    // Resolve a typed target page (used by the "go to page" input and button).
    function gotoHref(input: string): string | null {
        const p = parseInt(input, 10);
        if (isNaN(p) || p < 1 || p > totalPages) return null;
        return buildUrl(p);
    }

    function onGotoKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            const href = gotoHref(gotoInput);
            if (href) goto(href);
        }
    }


    onMount(() => {
        updateUrls();
        updateJumps();
    });

    beforeUpdate(() => {
        updateUrls();
        updateJumps();
    });

</script>


<nav class="pagination {size}" aria-label="Pagination">
    <a href={currentPage <= 1 ? null : firstPage} class="pagination-item" aria-label="First page" aria-disabled={ currentPage <= 1}>
        &laquo;
    </a>
    <a href={currentPage > 1 ? prevPage : null} class="pagination-item" aria-label="Previous page" aria-disabled={ currentPage <= 1} >
        &lsaquo;
    </a>

    {#each jumps as step}
        <a href={prevJumpUrls[step]} class="pagination-item jump" aria-label="Back {step} pages" aria-disabled={!prevJumpUrls[step]}>
            -{step}
        </a>
    {/each}

        <span class="page-nav-info">{pageText} {currentPage} / {totalPages}</span>

    {#each jumps as step}
        <a href={nextJumpUrls[step]} class="pagination-item jump" aria-label="Forward {step} pages" aria-disabled={!nextJumpUrls[step]}>
            +{step}
        </a>
    {/each}

    <a href={currentPage < totalPages ? nextPage : null} class="pagination-item right" aria-label="Next page" aria-disabled = { currentPage >= totalPages} >
        &rsaquo;
    </a>
    <a href={currentPage >= totalPages ? null : lastPage} class="pagination-item right" aria-label="Last page" aria-disabled = { currentPage >= totalPages}>
        &raquo;
    </a>

    <div class="goto">
        <input type="number" min="1" max={totalPages} bind:value={gotoInput} placeholder="Go to" aria-label="Go to page" on:keydown={onGotoKeydown} />
        <a href={gotoHref(gotoInput)} class="pagination-item go" aria-label="Go to page" aria-disabled={!gotoHref(gotoInput)}>
            Go
        </a>
    </div>
</nav>

<style>
    .pagination{
        margin: 1rem auto;
        width: 100%;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
    }

    .pagination-item{
        display:inline-flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        font-size: 1.8rem;
        text-decoration: none;
        position: relative;
        margin: 0 5px;
        border-radius: 20%;
        background: white;
        color: #808080;
    }

    .pagination-item::after {
        content: '';
        position: absolute;
        inset: -2px;
        border: 2px solid transparent;
        border-radius: 20%;
        opacity: 0;
        transition: 
            opacity 0.3s,
            border-color 0.3s;
    }

    .pagination-item:hover::after,
    .pagination-item:focus::after {
        border-color: #7bb7a2;
        opacity: 1;
        animation: pulse 1s infinite;
    }

    .pagination-item:active::after {
        border-color: #4a8c77;
        animation: none;
    }

    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(123, 183, 162, 0.5); }
        70% { box-shadow: 0 0 0 7px rgba(123, 183, 162, 0); }
        100% { box-shadow: 0 0 0 0 rgba(123, 183, 162, 0); }
    }
    /* Disabled state */
        .pagination-item[aria-disabled='true'] {
        opacity: 0.25;
        pointer-events: none;
    }

    .page-nav-info {
        font-family: 'Montserrat', sans-serif;
        font-size: clamp(16px, 3vw, 20px);
        color: #5b5b5b;
        padding: 0 10px;
        text-align: center;
    }

    /* Touch target enhancement */
    @media (pointer: coarse) {
        .pagination-item {
            width: 44px;
            height: 44px;
    }
    }

    .pagination-item:focus:not(:focus-visible) {
        outline: none;
    }

    /* Multi-page jump buttons (lean, compact) */
    .pagination-item.jump {
        width: 44px;
        height: 34px;
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 8px;
    }

    .goto {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
    }

    .goto input {
        width: 64px;
        height: 34px;
        padding: 0 6px;
        border: 1px solid #d0d0d0;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        text-align: center;
    }

    .pagination-item.go {
        width: 46px;
        height: 34px;
        font-size: 0.85rem;
        font-weight: 600;
        border-radius: 8px;
    }

    @media (pointer: coarse) {
        .pagination-item.jump,
        .pagination-item.go,
        .goto input {
            height: 44px;
        }
    }


</style>