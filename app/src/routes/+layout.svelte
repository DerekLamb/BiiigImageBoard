<script>
    import NavBar from "$lib/navBar.svelte";

</script>

<h1>b..d</h1>
<h3>Yeah... </h3>
<NavBar></NavBar>

<slot></slot>

<style>
    :global(body){
        background-color:#cbe9f4;
    }
    h1{
        font-family: 'Orbitron', sans-serif;
        color:#37b4b4;
    }
    h3{
        font-family: 'Orbitron', sans-serif;
        color:#339999;
    }
</style>