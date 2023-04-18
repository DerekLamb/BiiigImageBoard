<script>
    import NavBar from "$lib/navBar.svelte";

</script>

<h1>b..d</h1>
<p>Yeah... </p>
<NavBar></NavBar>

<slot></slot>

<style>
    :global(body){
        background-color:#ADD8E6;
    }
    h1{
        font-family: 'Orbitron', sans-serif;
        color:#37b4b4;
    }
    p{
        font-family: 'Orbitron', sans-serif;
        color:#339999;
    }
</style>