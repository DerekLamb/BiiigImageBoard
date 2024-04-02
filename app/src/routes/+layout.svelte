<script>
    import NavBar from "$lib/navBar.svelte";

</script>


<div class="mainFlex">
    <div class="boxContainer">
        <h1>b..d</h1>
        <h3>Something to be proud of ❤</h3>
    
        <div class="flexContainer">
            <NavBar></NavBar>
            <slot></slot>
        </div>
    </div>
</div>


<style>
    :global(body){
        background-color:#ffecef;
        height:100%;
    }
    h1{
        margin: 20px 140px;
        font-family: 'Orbitron', sans-serif;
        color:#7BAFD4;
    }
    h3{
        margin: 0px 180px 10px;
        font-family: 'Orbitron', sans-serif;
        color:#345D7E;
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
        height:100%;
        width:100%;
        max-width:1600px;
    }

    @media (max-width:1200px) {
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