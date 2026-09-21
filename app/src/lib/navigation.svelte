<script lang="ts">
	import SlideMenu from '$lib/svelteComponents/slideMenu.svelte';
	import { theme } from '$lib/stores/themeStore';
	import { page } from '$app/state';

	const NAV_LINKS = [
		{ href: '/posts', label: 'Posts' },
		{ href: '/postsByDate', label: 'By Date' },
		{ href: '/review', label: 'Review' },
		{ href: '/tags', label: 'Tags' },
		{ href: '/upload', label: 'Upload' },
		{ href: '/', label: 'Home' },
		{ href: '/login', label: 'Login' }
	];

	let menuOpen = $state(false);

	let currentPath = $derived(page.url.pathname);

	function isActive(href: string) {
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function toggleTheme() {
		theme.toggle();
	}
</script>

<!-- Regular Navbar -->
<div class="navContainer">
	<a class="mobileBrand" href="/">b..d</a>
	<div class="navbar">
		{#each NAV_LINKS as link}
			<a
				href={link.href}
				class:active={isActive(link.href)}
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
		<button class="theme-toggle" onclick={toggleTheme} title="Toggle theme">
			<span class="icon">🌙</span>
		</button>
	</div>
	<button
		class="menu-button"
		class:open={menuOpen}
		aria-label="Menu"
		aria-expanded={menuOpen}
		onclick={toggleMenu}
	>
		<i></i>
		<i></i>
		<i></i>
	</button>
</div>

<!-- Off-Canvas Menu for Mobile -->

{#key menuOpen}
	<SlideMenu {menuOpen}>
		{#each NAV_LINKS as link}
			<li>
				<a
					href={link.href}
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
					onclick={toggleMenu}
				>
					{link.label}
				</a>
			</li>
		{/each}
		<li class="theme-row">
			<button class="theme-toggle" onclick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
				<span class="icon">🌙</span>
			</button>
		</li>
	</SlideMenu>
{/key}

<style>
	@media (min-width: 769px) {
		.navbar {
			display: flex;
		}

		.navContainer {
			display: flex;
		}

		.menu-button {
			display: none;
		}

		.mobileBrand {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.navbar {
			display: none;
		}

		.mobileBrand {
			display: inline;
		}

		.menu-button {
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		.navContainer {
			display: flex;
			position: sticky;
			top: 0;
			z-index: 1000;
			align-items: center;
			height: calc(48px + env(safe-area-inset-top, 0px));
			box-sizing: border-box;
			padding: 0 12px;
			padding-top: env(safe-area-inset-top, 0px);
			background-color: var(--bg-secondary);
			border-bottom: 1px solid var(--border-color);
		}
	}
	.navContainer {
		justify-content: space-between;
		padding: 1rem;
	}

	.mobileBrand {
		margin: 0;
		font-family: 'Orbitron', sans-serif;
		font-weight: 600;
		font-size: 1.25rem;
		color: var(--text-accent);
		text-decoration: none;
	}

	.navbar {
		align-self: stretch;
	}

	.navbar a {
		color: var(--nav-text);
		font-family: 'Montserrat', sans-serif;
		font-size: 1.2rem;
		margin: 5px 10px;
		text-decoration: none;
		display: inline;
	}

	.theme-toggle {
		background: var(--button-bg);
		border: none;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 10px;
		transition: background-color 0.3s ease;
	}

	.theme-toggle:hover {
		opacity: 0.8;
	}

	.theme-toggle .icon {
		font-size: 1.1rem;
	}

	li {
		list-style-type: none;
		color: var(--nav-text);
		font-family: 'Montserrat', sans-serif;
		font-size: 1.2rem;
		margin: 10px 30px;
		text-decoration: none;
	}

	a:hover {
		animation: blinkFade 0.5s cubic-bezier(0, 1, 0.5, 0.91) forwards;
	}

	a {
		color: var(--nav-text);
		text-decoration: none;
	}
	a:visited {
		color: var(--nav-text);
	}

	a.active {
		color: var(--text-accent);
		font-weight: 600;
	}

	@keyframes blinkFade {
		0% {
			color: var(--text-blink);
		}
		100% {
			color: var(--text-hover);
		}
	}

	.menu-button {
		cursor: pointer;
		width: 44px;
		height: 44px;
		padding: 10px;
		box-sizing: border-box;
		flex-shrink: 0;
		border-radius: 50%;
		background-color: var(--button-bg);
		border: none;
	}

	.menu-button i {
		background-color: var(--button-text);
		border-radius: 2px;
		content: '';
		display: block;
		width: 100%;
		height: 4px;
	}
	.menu-button i:nth-child(1) {
		-webkit-animation: outT 0.8s backwards;
		animation: outT 0.8s backwards;
		-webkit-animation-direction: reverse;
		animation-direction: reverse;
	}
	.menu-button i:nth-child(2) {
		margin: 5px 0;
		-webkit-animation: outM 0.8s backwards;
		animation: outM 0.8s backwards;
		-webkit-animation-direction: reverse;
		animation-direction: reverse;
	}
	.menu-button i:nth-child(3) {
		-webkit-animation: outBtm 0.8s backwards;
		animation: outBtm 0.8s backwards;
		-webkit-animation-direction: reverse;
		animation-direction: reverse;
	}
	.menu-button.open i:nth-child(1) {
		-webkit-animation: inT 0.8s forwards;
		animation: inT 0.8s forwards;
	}
	.menu-button.open i:nth-child(2) {
		-webkit-animation: inM 0.8s forwards;
		animation: inM 0.8s forwards;
	}
	.menu-button.open i:nth-child(3) {
		-webkit-animation: inBtm 0.8s forwards;
		animation: inBtm 0.8s forwards;
	}

	@-webkit-keyframes inM {
		50% {
			-webkit-transform: rotate(0deg);
		}
		100% {
			-webkit-transform: rotate(45deg);
		}
	}
	@keyframes inM {
		50% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(45deg);
		}
	}
	@-webkit-keyframes outM {
		50% {
			-webkit-transform: rotate(0deg);
		}
		100% {
			-webkit-transform: rotate(45deg);
		}
	}
	@keyframes outM {
		50% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(45deg);
		}
	}
	@-webkit-keyframes inT {
		0% {
			-webkit-transform: translateY(0px) rotate(0deg);
		}
		50% {
			-webkit-transform: translateY(9px) rotate(0deg);
		}
		100% {
			-webkit-transform: translateY(9px) rotate(135deg);
		}
	}
	@keyframes inT {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(9px) rotate(0deg);
		}
		100% {
			transform: translateY(9px) rotate(135deg);
		}
	}
	@-webkit-keyframes outT {
		0% {
			-webkit-transform: translateY(0px) rotate(0deg);
		}
		50% {
			-webkit-transform: translateY(9px) rotate(0deg);
		}
		100% {
			-webkit-transform: translateY(9px) rotate(135deg);
		}
	}
	@keyframes outT {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(9px) rotate(0deg);
		}
		100% {
			transform: translateY(9px) rotate(135deg);
		}
	}
	@-webkit-keyframes inBtm {
		0% {
			-webkit-transform: translateY(0px) rotate(0deg);
		}
		50% {
			-webkit-transform: translateY(-9px) rotate(0deg);
		}
		100% {
			-webkit-transform: translateY(-9px) rotate(135deg);
		}
	}
	@keyframes inBtm {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-9px) rotate(0deg);
		}
		100% {
			transform: translateY(-9px) rotate(135deg);
		}
	}
	@-webkit-keyframes outBtm {
		0% {
			-webkit-transform: translateY(0px) rotate(0deg);
		}
		50% {
			-webkit-transform: translateY(-9px) rotate(0deg);
		}
		100% {
			-webkit-transform: translateY(-9px) rotate(135deg);
		}
	}
	@keyframes outBtm {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-9px) rotate(0deg);
		}
		100% {
			transform: translateY(-9px) rotate(135deg);
		}
	}
</style>
