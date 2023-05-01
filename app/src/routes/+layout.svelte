<script>
    import NavBar from "$lib/navBar.svelte";

</script>


<div class="boxContainer">
    <h1>b..d</h1>
    <h3>Something to be proud of ❤</h3>
    <NavBar></NavBar>
    <div class="flexContainer"><slot></slot></div>
</div>


<style>
    :global(body){
        background-color:#cbe9f4;
    }
    h1{
        margin: 20px 140px;
        font-family: 'Orbitron', sans-serif;
        color:#37b4b4;
    }
    h3{
        margin: 0px 180px 10px;
        font-family: 'Orbitron', sans-serif;
        color:#339999;
    }
    .boxContainer{
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        margin: 0px 120px;
    }
        /* remove margin when screen size reaches 800px */
    @media (max-width:1350px) {
        .boxContainer {
            margin: 0;
        }
    }
    .flexContainer{
        display:flex;
        justify-content: center;
    }
    ul{
        flex:1;
    }
</style>