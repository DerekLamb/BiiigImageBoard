<script>
	import Navigation from "$lib/navigation.svelte";
	import { theme } from "$lib/stores/themeStore";
	import "$lib/styles/theme.css";
	import { onMount, tick } from "svelte";
	import { beforeNavigate, afterNavigate } from "$app/navigation";
	import { saveReturnState, getReturnState, clearReturnState } from "$lib/returnTo.svelte.ts";

	// Content-browsing pages that act as "listing" pages a user can come back to.
	const LISTING_ROOTS = new Set([
		"/", "/posts", "/postsByDate", "/postsDynamic", "/postsSmart", "/postGroups", "/review", "/tags"
	]);

	function isListingPath(pathname) {
		if (pathname === "/") return true;
		const segs = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
		return segs.length === 1 && LISTING_ROOTS.has("/" + segs[0]);
	}

	// When leaving a listing page, remember it (URL + scroll) so detail pages
	// can return the user to exactly where they were.
	beforeNavigate((nav) => {
		if (!nav.from) return;
		if (isListingPath(nav.from.url.pathname)) {
			saveReturnState(nav.from.url.href, window.scrollY);
		}
	});

	// When landing back on the listing we recorded, restore its scroll position.
	afterNavigate(async ({ to }) => {
		if (!to || !isListingPath(to.url.pathname)) return;
		const saved = getReturnState();
		const scrollY = saved.scrollY;
		if (saved.url && saved.url === to.url.href) {
			clearReturnState();
			await tick();
			requestAnimationFrame(() => window.scrollTo(0, scrollY));
		}
	});

	onMount(() => {
		theme.initialize();
	});
</script>


<div class="mainFlex">
    <div class="boxContainer">
        <div class="logo">
            <h1>b..d</h1>
            <h3>Something to be proud of ❤</h3>
        </div>

    
        <div class="flexContainer">
            <Navigation></Navigation>
            <slot></slot>
        </div>
    </div>
</div>


<style>

    :global(html){
        width:100%;
    }
    :global(body){
        background-color: var(--bg-primary);
        margin:0;
        height:100%;
        width:100%;
        transition: background-color 0.3s ease;
    }

    .mainFlex{
        display:flex;
        justify-content: center;
    }
    .boxContainer{
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        margin: 0px 50px;
        width:100%;
        max-width:85%;
    }

    .logo{
        margin-left: 50px;
        display:grid;
        grid-template-areas:
        "logo . ."
        ". . tagline";
    }

    .logo h1{
        margin: 10px;
        grid-area: logo;
        font-family: 'Orbitron', sans-serif;
        color: var(--text-accent);
    }

    .logo h3{
        /* margin: 0px 180px 10px; */
        grid-area: tagline;
        font-family: 'Orbitron', sans-serif;
        color: var(--text-primary);
    }

    @media (max-width:1450px) {
        .boxContainer {
            margin: 0;
            max-width: 100%;
        }
        
        .logo h3 {
            display:none;
        }
    }
    .flexContainer{
        display:flex;
        flex-direction: column;
        justify-content: center;
        align-self: stretch;
        margin: 0 5vw;
    }

    @media (max-width:768px){
        .flexContainer{
            margin: 0 0;
        }

        .logo {
            display:none;
        }
    }
</style>