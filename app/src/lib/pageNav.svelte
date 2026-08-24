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

    // Ruler geometry: the track maps the largest tier distance onto RULER_PX.
    // (Computed once at mount; tiers are expected to be static per usage.)
    const RULER_PX = 160;
    const maxTierPx = tiers[tiers.length - 1].px;
    const rulerScale = RULER_PX / maxTierPx;
    const rulerTicks = [
        { px: 0, jump: 1 },
        ...tiers.map(t => ({ px: t.px, jump: t.jump })),
    ];
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
    let scrubTarget = 1;     // clamped target page shown on the ruler
    let thunked = false;
    let suppressClick = false;
    let scrubPointerId: number | null = null;
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


    function startScrub(button: 'prev' | 'next', e: PointerEvent) {
        if (scrubButton) return;
        // Stop the browser's native link-drag (the "ghost" image) and text
        // selection; otherwise dragging an <a href> fires pointercancel and
        // kills the scrub the instant the pointer leaves the button.
        e.preventDefault();
        const enabled = button === 'prev' ? currentPage > 1 : currentPage < totalPages;
        if (!enabled) return;

        scrubButton = button;
        scrubPointerId = e.pointerId;
        arming = true;
        armed = false;
        scrubStartY = e.clientY;
        scrubDrag = 0;
        scrubJump = 1;
        scrubTarget = clamp(currentPage + (button === 'next' ? 1 : -1), 1, totalPages);

        // Track the gesture on window so the pointer can roam anywhere;
        // element-level capture alone is not reliable for this.
        window.addEventListener('pointermove', onScrubMove);
        window.addEventListener('pointerup', onScrubEnd);
        window.addEventListener('pointercancel', onScrubCancel);

        armTimer = setTimeout(() => {
            if (scrubButton) {
                arming = false;
                armed = true;
                vibrate(10);
            }
        }, holdMs);
    }

    function onScrubMove(e: PointerEvent) {
        if (!armed || !scrubButton || e.pointerId !== scrubPointerId) return;
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
    }

    function resetScrub() {
        scrubButton = null;
        scrubPointerId = null;
        arming = false;
        armed = false;
        scrubDrag = 0;
        scrubJump = 1;
        scrubTarget = currentPage;
    }

    function onScrubEnd(e: PointerEvent) {
        if (e.pointerId !== scrubPointerId) return;
        endScrub(true);
    }

    function onScrubCancel(e: PointerEvent) {
        if (e.pointerId !== scrubPointerId) return;
        endScrub(false);
    }

    function endScrub(navigate: boolean) {
        window.removeEventListener('pointermove', onScrubMove);
        window.removeEventListener('pointerup', onScrubEnd);
        window.removeEventListener('pointercancel', onScrubCancel);
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
            draggable={false}
            on:pointerdown={(e) => startScrub('prev', e)}
            on:click={onClickGuard}>
            &lsaquo;
        </a>
        {#if armed && scrubButton === 'prev'}
            <div class="scrub-ruler side-left" class:thunk={thunked} aria-hidden="true">
                <div class="ruler-track" style="height: {RULER_PX}px">
                    {#each rulerTicks as t (t.jump)}
                        <div class="ruler-tick" class:active={scrubJump === t.jump} style="top: {t.px * rulerScale}px">
                            <span class="tick-label">{t.jump}</span>
                            <span class="tick-line"></span>
                        </div>
                    {/each}
                    <div class="ruler-thumb" style="top: {Math.min(scrubDrag, maxTierPx) * rulerScale}px"></div>
                </div>
                <div class="ruler-target">&larr; {scrubTarget}</div>
            </div>
        {/if}
    </span>

        <span class="page-nav-info">{pageText} {currentPage} / {totalPages}</span>

    <span class="scrub-wrap"
        class:arming={arming && scrubButton === 'next'}
        class:armed={armed && scrubButton === 'next'}>
        <a href={currentPage < totalPages ? nextPage : null} class="pagination-item right" aria-label="Next page"
            aria-disabled = { currentPage >= totalPages }
            draggable={false}
            on:pointerdown={(e) => startScrub('next', e)}
            on:click={onClickGuard}>
            &rsaquo;
        </a>
        {#if armed && scrubButton === 'next'}
            <div class="scrub-ruler side-right" class:thunk={thunked} aria-hidden="true">
                <div class="ruler-track" style="height: {RULER_PX}px">
                    {#each rulerTicks as t (t.jump)}
                        <div class="ruler-tick" class:active={scrubJump === t.jump} style="top: {t.px * rulerScale}px">
                            <span class="tick-label">{t.jump}</span>
                            <span class="tick-line"></span>
                        </div>
                    {/each}
                    <div class="ruler-thumb" style="top: {Math.min(scrubDrag, maxTierPx) * rulerScale}px"></div>
                </div>
                <div class="ruler-target">&rarr; {scrubTarget}</div>
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
        user-select: none;
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

    /* State-held look: the button stays visibly pressed for the whole
       gesture, no matter where the captured pointer has wandered. */
    .scrub-wrap .pagination-item {
        transition: background 120ms ease, color 120ms ease, transform 120ms ease;
    }

    .scrub-wrap.arming .pagination-item,
    .scrub-wrap.armed .pagination-item {
        background: #e3f0ea;
        color: #2d5a4c;
        transform: scale(1.06);
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

    /* Unfurling notched ruler: appears beside the button once armed. */
    .scrub-ruler {
        position: absolute;
        top: -10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: #2d2d2d;
        padding: 10px 8px 8px;
        border-radius: 12px;
        pointer-events: none;
        z-index: 10;
        transform-origin: top center;
        animation: rulerUnfurl 140ms ease-out;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .scrub-ruler.side-right { left: calc(100% + 10px); }
    .scrub-ruler.side-left  { right: calc(100% + 10px); }

    @keyframes rulerUnfurl {
        from { opacity: 0; transform: scaleY(0.5); }
        to   { opacity: 1; transform: scaleY(1); }
    }

    .ruler-track {
        position: relative;
        width: 40px;
    }

    .ruler-tick {
        position: absolute;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        gap: 4px;
        transform: translateY(-50%);
    }

    .tick-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.6rem;
        line-height: 1;
        color: #9a9a9a;
        width: 16px;
        text-align: right;
        transition: transform 80ms ease, color 80ms ease;
    }

    .tick-line {
        flex: 1;
        height: 2px;
        background: #555;
        border-radius: 1px;
        transition: background 80ms ease, height 80ms ease;
    }

    .ruler-tick.active .tick-line {
        background: #7bb7a2;
        height: 3px;
    }

    .ruler-tick.active .tick-label {
        color: #a8e6cf;
        font-weight: 700;
        transform: scale(1.25);
    }

    .ruler-thumb {
        position: absolute;
        left: -4px;
        right: -4px;
        height: 5px;
        border-radius: 3px;
        background: #7bb7a2;
        box-shadow: 0 0 8px 2px rgba(123, 183, 162, 0.8);
        transform: translateY(-50%);
        transition: top 30ms linear;
    }

    .ruler-target {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        color: #a8d5c6;
        background: rgba(123, 183, 162, 0.15);
        padding: 2px 7px;
        border-radius: 5px;
        white-space: nowrap;
    }

    /* Boundary thunk: the ruler shudders when the target clamps */
    .scrub-ruler.thunk {
        animation: rulerThunk 160ms ease;
    }

    @keyframes rulerThunk {
        0%, 100% { transform: translateX(0); }
        30% { transform: translateX(-4px) rotate(-1deg); }
        60% { transform: translateX(3px) rotate(1deg); }
    }

</style>
