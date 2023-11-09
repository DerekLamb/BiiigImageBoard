<script>
    import NavBar from "$lib/navBar.svelte";

</script>


<div class="boxContainer">
    <h1>b..d</h1>
    <h3>Something to be proud of ❤</h3>
    
    <div class="flexContainer">
        <NavBar></NavBar>
        <slot></slot>
    </div>
</div>


<style>
    :global(body){
        background-color:#1C1C1C;
        height:100%;
    }
    h1{
        margin: 20px 140px;
        font-family: 'Orbitron', sans-serif;
        color:#ffffff;
    }
    h3{
        margin: 0px 180px 10px;
        font-family: 'Orbitron', sans-serif;
        color:#ffffff;
    }
    .boxContainer{
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        margin: 0px 50px;
        height:100%;
    }
        /* remove margin when screen size reaches 800px */
    @media (max-width:1730px) {
        .boxContainer {
            margin: 0;
        }
    }
    .flexContainer{
        display:flex;
        flex-direction: column;
        justify-content: center;
        align-self: stretch;
    }
</style>