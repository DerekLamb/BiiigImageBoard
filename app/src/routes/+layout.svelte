<script>
    import NavBar from "$lib/navBar.svelte";

</script>


<div class="boxContainer">
    <h1>b..d</h1>
    <h3>Yeah... </h3>
    <NavBar></NavBar>
    <div class="flexContainer"><slot></slot></div>
</div>


<style>
    :global(body){
        background-color:#cbe9f4;
    }
    h1{
        flex:1;
        font-family: 'Orbitron', sans-serif;
        color:#37b4b4;
    }
    h3{
        flex: 1;
        font-family: 'Orbitron', sans-serif;
        color:#339999;
    }
    .boxContainer{
        display:flex;
        flex-direction: column;
        align-items: center;
    }
    .flexContainer{
        display:flex;
        justify-content: center;
    }
    ul{
        flex:1;
    }
</style>