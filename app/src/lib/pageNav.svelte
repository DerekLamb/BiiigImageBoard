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

    // ---- Hold-to-scrub settings -------------------------------------------
    // How long (ms) a prev/next button must be held before scrubbing arms.
    export let holdMs = 400;
    // Drag-distance (px) thresholds -> jump magnitude, ascending.
    // Holding without dragging uses the base jump of 1 page.
    export let tiers = [
        { px: 40,  jump: 10 },
        { px: 120, jump: 50 },
        { px: 240, jump: 100 },
    ];

    const tierJumps = [1, ...tiers.map(t => t.jump)];
    // -------------------------------------------------------------------------

    let nextPage: string | null = null;
    let prevPage: string | null = null;
    let firstPage: string | null = null;
    let lastPage: string | null = null;

    // Scrub state (only one pointer is tracked at a time).
    let scrubButton: 'prev' | 'next' | null = null;
    let arming = false;
    let armed = false;
    let scrubStartY = 0;
    let scrubDrag = 0;       // px dragged in the effective direction
    let scrubJump = 1;       // current tier jump magnitude
    let scrubTarget = 1;     // clamped target page shown in the bubble
    let scrubMeter = 0;      // 0-100 fill of the current tier band
    let thunked = false;
    let suppressClick = false;
    let armTimer: ReturnType<typeof setTimeout> | null = null;
    let thunkTimer: ReturnType<typeof setTimeout> | null = null;


    function clamp(n: number, lo: number, hi: number) {
        return Math.min(hi, Math.max(lo, n));
    }

    function vibrate(ms: number) {
        if (browser && 'vibrate' in navigator) navigator.vibrate(ms);
    }

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


    // Fraction (0-100) through the tier band the current drag sits in.
    function meterFor(dragPx: number): number {
        const pts = [0, ...tiers.map(t => t.px)];
        for (let i = 0; i < pts.length - 1; i++) {
            if (dragPx <= pts[i + 1]) {
                return ((dragPx - pts[i]) / (pts[i + 1] - pts[i])) * 100;
            }
        }
        return 100;
    }

    function startScrub(button: 'prev' | 'next', e: PointerEvent) {
        if (scrubButton) return;
        const enabled = button === 'prev' ? currentPage > 1 : currentPage < totalPages;
        if (!enabled) return;

        scrubButton = button;
        arming = true;
        armed = false;
        scrubStartY = e.clientY;
        scrubDrag = 0;
        scrubJump = 1;
        scrubMeter = 0;
        scrubTarget = clamp(currentPage + (button === 'next' ? 1 : -1), 1, totalPages);

        // Capture so the finger/mouse can roam off the button while scrubbing.
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

        armTimer = setTimeout(() => {
            if (scrubButton) {
                arming = false;
                armed = true;
                vibrate(10);
            }
        }, holdMs);
    }

    function onScrubMove(e: PointerEvent) {
        if (!armed || !scrubButton) return;
        e.preventDefault();

        // Next: drag up. Prev: drag down.
        const sign = scrubButton === 'next' ? 1 : -1;
        scrubDrag = Math.max(0, (scrubStartY - e.clientY) * sign);

        let jump = 1;
        for (const t of tiers) if (scrubDrag >= t.px) jump = t.jump;
        if (jump !== scrubJump) {
            scrubJump = jump;
            vibrate(15); // tick on tier change
        }

        const raw = currentPage + sign * jump;
        const target = clamp(raw, 1, totalPages);
        if (raw !== target && !thunked) {
            // Hit the first/last boundary: physical "thunk".
            thunked = true;
            vibrate(25);
            thunkTimer = setTimeout(() => { thunked = false; }, 180);
        }

        scrubTarget = target;
        scrubMeter = meterFor(scrubDrag);
    }

    function resetScrub() {
        scrubButton = null;
        arming = false;
        armed = false;
        scrubDrag = 0;
        scrubJump = 1;
        scrubMeter = 0;
        scrubTarget = currentPage;
    }

    function endScrub(navigate: boolean) {
        if (armTimer) {
            clearTimeout(armTimer);
            armTimer = null;
        }
        // Navigate on release only.
        if (navigate && armed && scrubButton && scrubTarget !== currentPage) {
            suppressClick = true; // swallow the native click that follows
            goto(buildUrl(scrubTarget));
        }
        resetScrub();
    }

    function onClickGuard(e: MouseEvent) {
        if (suppressClick) {
            e.preventDefault();
            suppressClick = false;
        }
    }


    onMount(() => {
        updateUrls();
    });

    beforeUpdate(() => {
        updateUrls();
    });

</script>


<nav class="pagination {size}" aria-label="Pagination" style="--hold-ms: {holdMs}ms">
    <a href={currentPage <= 1 ? null : firstPage} class="pagination-item" aria-label="First page" aria-disabled={ currentPage <= 1}>
        &laquo;
    </a>

    <span class="scrub-wrap"
        class:arming={arming && scrubButton === 'prev'}
        class:armed={armed && scrubButton === 'prev'}>
        <a href={currentPage > 1 ? prevPage : null} class="pagination-item" aria-label="Previous page"
            aria-disabled={ currentPage <= 1 }
            on:pointerdown={(e) => startScrub('prev', e)}
            on:pointermove={onScrubMove}
            on:pointerup={() => endScrub(true)}
            on:pointercancel={() => endScrub(false)}
            on:click={onClickGuard}>
            &lsaquo;
        </a>
        {#if armed && scrubButton === 'prev'}
            <div class="scrub-bubble" class:thunk={thunked} role="status">
                <div class="scrub-delta">&minus;{scrubJump}</div>
                <div class="scrub-tiers">
                    {#each tierJumps as t (t)}
                        <span class="tier" class:active={t === scrubJump}>{t}</span>
                    {/each}
                </div>
                <div class="scrub-meter"><div class="scrub-meter-fill" style="width: {scrubMeter}%"></div></div>
                <div class="scrub-target">&rarr; Page {scrubTarget}</div>
            </div>
        {/if}
    </span>

        <span class="page-nav-info">{pageText} {currentPage} / {totalPages}</span>

    <span class="scrub-wrap"
        class:arming={arming && scrubButton === 'next'}
        class:armed={armed && scrubButton === 'next'}>
        <a href={currentPage < totalPages ? nextPage : null} class="pagination-item right" aria-label="Next page"
            aria-disabled = { currentPage >= totalPages }
            on:pointerdown={(e) => startScrub('next', e)}
            on:pointermove={onScrubMove}
            on:pointerup={() => endScrub(true)}
            on:pointercancel={() => endScrub(false)}
            on:click={onClickGuard}>
            &rsaquo;
        </a>
        {#if armed && scrubButton === 'next'}
            <div class="scrub-bubble" class:thunk={thunked} role="status">
                <div class="scrub-delta">+{scrubJump}</div>
                <div class="scrub-tiers">
                    {#each tierJumps as t (t)}
                        <span class="tier" class:active={t === scrubJump}>{t}</span>
                    {/each}
                </div>
                <div class="scrub-meter"><div class="scrub-meter-fill" style="width: {scrubMeter}%"></div></div>
                <div class="scrub-target">&rarr; Page {scrubTarget}</div>
            </div>
        {/if}
    </span>

    <a href={currentPage >= totalPages ? null : lastPage} class="pagination-item right" aria-label="Last page" aria-disabled = { currentPage >= totalPages}>
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

    /* ---- Hold-to-scrub ---------------------------------------------------- */

    .scrub-wrap {
        position: relative;
        display: inline-flex;
        margin: 0 5px;
    }

    .scrub-wrap .pagination-item {
        margin: 0;
        touch-action: none; /* don't let the browser scroll mid-scrub */
    }

    /* Arming glow: outline grows outward and brightens over holdMs,
       then breathes once armed. */
    .scrub-wrap .pagination-item::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 20%;
        border: 2px solid transparent;
        box-shadow: 0 0 0 0 rgba(123, 183, 162, 0);
        opacity: 0;
        pointer-events: none;
    }

    .scrub-wrap.arming .pagination-item::before {
        animation: holdGrow var(--hold-ms, 400ms) ease-out forwards;
    }

    .scrub-wrap.armed .pagination-item::before {
        border-color: #4a8c77;
        opacity: 1;
        animation: holdPulse 1.2s ease-in-out infinite;
    }

    /* Keep the hover border out of the way while holding */
    .scrub-wrap.arming .pagination-item:hover::after,
    .scrub-wrap.armed .pagination-item:hover::after {
        opacity: 0;
        animation: none;
    }

    @keyframes holdGrow {
        0% {
            transform: scale(0.92);
            opacity: 0;
            border-color: rgba(123, 183, 162, 0.4);
            box-shadow: 0 0 0 0 rgba(123, 183, 162, 0);
        }
        100% {
            transform: scale(1.1);
            opacity: 1;
            border-color: #4a8c77;
            box-shadow: 0 0 14px 3px rgba(123, 183, 162, 0.55);
        }
    }

    @keyframes holdPulse {
        0%, 100% {
            transform: scale(1.1);
            box-shadow: 0 0 10px 2px rgba(123, 183, 162, 0.45);
        }
        50% {
            transform: scale(1.18);
            box-shadow: 0 0 20px 6px rgba(123, 183, 162, 0.7);
        }
    }

    /* Floating selection bubble */
    .scrub-bubble {
        position: absolute;
        bottom: calc(100% + 14px);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background: #2d2d2d;
        color: #fff;
        padding: 8px 12px;
        border-radius: 10px;
        min-width: 96px;
        pointer-events: none;
        z-index: 10;
        animation: bubbleIn 120ms ease-out;
    }

    .scrub-bubble::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #2d2d2d;
    }

    @keyframes bubbleIn {
        from { opacity: 0; transform: translateX(-50%) translateY(4px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .scrub-delta {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        line-height: 1;
    }

    .scrub-tiers {
        display: flex;
        gap: 4px;
    }

    .tier {
        font-size: 0.65rem;
        line-height: 1;
        padding: 2px 5px;
        border-radius: 4px;
        background: #4a4a4a;
        opacity: 0.6;
        transition: transform 80ms ease, opacity 80ms ease, background 80ms ease;
    }

    .tier.active {
        background: #7bb7a2;
        color: #1c1c1c;
        opacity: 1;
        transform: scale(1.2);
    }

    .scrub-meter {
        width: 100%;
        height: 3px;
        border-radius: 2px;
        background: #4a4a4a;
        overflow: hidden;
    }

    .scrub-meter-fill {
        height: 100%;
        background: #7bb7a2;
        transition: width 40ms linear;
    }

    .scrub-target {
        font-size: 0.75rem;
        color: #a8d5c6;
    }

    /* Boundary thunk: the bubble shudders when the target clamps */
    .scrub-bubble.thunk {
        animation: thunk 160ms ease;
    }

    @keyframes thunk {
        0%, 100% { transform: translateX(-50%); }
        30% { transform: translateX(calc(-50% - 5px)) rotate(-2deg); }
        60% { transform: translateX(calc(-50% + 4px)) rotate(2deg); }
    }

</style>
