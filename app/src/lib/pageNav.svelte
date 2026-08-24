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
    export let holdMs = 400; // how long (ms) a button must be held before its hold handler fires


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


    function updateUrls() {
        if (browser) {
            firstPage = buildUrl(1);
            lastPage = buildUrl(totalPages);
            prevPage = currentPage > 1 ? buildUrl(currentPage - 1) : '';
            nextPage = currentPage < totalPages ? buildUrl(currentPage + 1) : '';
        }
    }


    // Build a set of pointer handlers that only fire `target()` once the
    // element has been held for `holdMs`. Releasing, leaving, or cancelling
    // the pointer before the hold completes aborts it. If the hold already
    // fired, the subsequent native click is suppressed so we don't navigate
    // twice.
    function hold(target: () => string | null) {
        let timer: ReturnType<typeof setTimeout> | null = null;
        let held = false;

        function clear() {
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        }

        return {
            onpointerdown: () => {
                held = false;
                clear();
                timer = setTimeout(() => {
                    const url = target();
                    if (url) {
                        held = true;
                        goto(url);
                    }
                }, holdMs);
            },
            onpointerup: clear,
            onpointerleave: clear,
            onpointercancel: clear,
            click: (e: MouseEvent) => {
                if (held) e.preventDefault();
            },
        };
    }

    const firstHold = hold(() => currentPage <= 1 ? null : firstPage);
    const prevHold  = hold(() => currentPage > 1 ? prevPage : null);
    const nextHold  = hold(() => currentPage < totalPages ? nextPage : null);
    const lastHold  = hold(() => currentPage >= totalPages ? null : lastPage);


    onMount(() => {
        updateUrls();
    });

    beforeUpdate(() => {
        updateUrls();
    });

</script>


<nav class="pagination {size}" aria-label="Pagination">
    <a href={currentPage <= 1 ? null : firstPage} class="pagination-item" aria-label="First page" aria-disabled={ currentPage <= 1}
        on:pointerdown={firstHold.onpointerdown} on:pointerup={firstHold.onpointerup}
        on:pointerleave={firstHold.onpointerleave} on:pointercancel={firstHold.onpointercancel}
        on:click={firstHold.click}>
        &laquo;
    </a>
    <a href={currentPage > 1 ? prevPage : null} class="pagination-item" aria-label="Previous page" aria-disabled={ currentPage <= 1}
        on:pointerdown={prevHold.onpointerdown} on:pointerup={prevHold.onpointerup}
        on:pointerleave={prevHold.onpointerleave} on:pointercancel={prevHold.onpointercancel}
        on:click={prevHold.click} >
        &lsaquo;
    </a> 
        <span class="page-nav-info">{pageText} {currentPage} / {totalPages}</span>
    <a href={currentPage < totalPages ? nextPage : null} class="pagination-item right" aria-label="Next page" aria-disabled = { currentPage >= totalPages}
        on:pointerdown={nextHold.onpointerdown} on:pointerup={nextHold.onpointerup}
        on:pointerleave={nextHold.onpointerleave} on:pointercancel={nextHold.onpointercancel}
        on:click={nextHold.click}>
        &rsaquo;
    </a>
    <a href={currentPage >= totalPages ? null : lastPage} class="pagination-item right" aria-label="Last page" aria-disabled = { currentPage >= totalPages}
        on:pointerdown={lastHold.onpointerdown} on:pointerup={lastHold.onpointerup}
        on:pointerleave={lastHold.onpointerleave} on:pointercancel={lastHold.onpointercancel}
        on:click={lastHold.click}>
        &raquo;
    </a>
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


</style>