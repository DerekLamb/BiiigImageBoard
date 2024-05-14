<script >
    export 

</script>

<!-- Off-Canvas Menu for Mobile -->
<div class="menu-container" class:open={$menuOpen} on:click={toggleMenu} on:keydown={toggleMenu} role="menu" tabindex=0>
    <!-- Mobile Menu Content -->
    <nav>
        <ul>
            <li><a href="/posts">Posts</a></li>
            <li><a href="/tags">Tags</a></li>
            <li><a href="/upload">Upload</a></li>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
        </ul>
    </nav>
</div>  