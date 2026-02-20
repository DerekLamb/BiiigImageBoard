<script>
    import SlideMenu from "$lib/svelteComponents/slideMenu.svelte";
    import { theme } from "$lib/stores/themeStore";

    let menuOpen = false;

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    function toggleTheme() {
        theme.toggle();
    }
</script>
   
<!-- Regular Navbar -->
<div class="navContainer">
    <div class="navbar">
        <a href="/posts" >Posts</a>
        <a href="/tags" >Tags</a>
        <a href="/upload" >Upload</a>
        <a href="/" >Home</a>
        <a href="/login" >Login</a>
        <button class="theme-toggle" on:click={toggleTheme} title="Toggle theme">
            <span class="icon">🌙</span>
        </button>
    </div>
</div>

<!-- Menu Button for Mobile -->
<button class="menu-button" class:open={menuOpen} on:click={toggleMenu}>
    <i></i>
    <i></i>
    <i></i>
</button>

<!-- Off-Canvas Menu for Mobile -->

{#key menuOpen}
<SlideMenu menuOpen = {menuOpen}>
    <li><a href="/posts" on:click={toggleMenu}>Posts</a></li>
    <li><a href="/tags" on:click={toggleMenu}>Tags</a></li>
    <li><a href="/upload" on:click={toggleMenu}>Upload</a></li>
    <li><a href="/" on:click={toggleMenu}>Home</a></li>
    <li><a href="/login" on:click={toggleMenu}>Login</a></li>
</SlideMenu>
{/key}
  
<style>
    @media (min-width: 600px) {
        .navbar {
            display: flex;
        }

        .navContainer {
            display: flex;
        }
    
        .menu-button {
            display: none;
        }
    }
  
    @media (max-width: 768px) {
        .menu-button {
            display: block;
        }
        .navbar {
            display: none;
        }

        .navContainer {
            display:none;
        }

    }
    .navContainer {
        justify-content: space-between;
        padding: 1rem;
    }

    .navbar {
        align-self: stretch;
    }

    .navbar a {
        color: var(--nav-text);
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        margin:5px 10px ;
        text-decoration: none;
        display:inline;
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
        margin:10px 30px;
        text-decoration: none;
    }

    a:hover{
        animation: blinkFade 0.5s cubic-bezier(0,1,.5,.91) forwards;
    }

    a {
        color: var(--nav-text);
        text-decoration: none;
    }
    a:visited{
        color: var(--nav-text);
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
        position: fixed;
        cursor: pointer;
        padding: 10px;
        height: 50px;
        width: 50px;
        right: 30px;
        bottom: 30px;
        border-radius: 50%;
        transform: translateX(-50%);
        transform: translateY(-50%);
        background-color: var(--button-bg);
        z-index: 1000;
        border:none;
    }


    .menu-button i {
        background-color: var(--button-text);
        border-radius: 2px;
        content: "";
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