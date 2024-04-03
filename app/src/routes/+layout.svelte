<script>
    import NavBar from "$lib/navBar.svelte";

</script>


<div class="mainFlex">
    <div class="boxContainer">
        <div class="logo">
            <h1>b..d</h1>
            <h3>Something to be proud of ❤</h3>
        </div>

    
        <div class="flexContainer">
            <NavBar></NavBar>
            <slot></slot>
        </div>
    </div>
</div>


<style>

    :global(html){
        width:100%;
    }
    :global(body){
        background-color:#ffecef;
        margin:0;
        height:100%;
        width:100%;
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
        max-width:1600px;
    }

    .logo{
        display:grid;
        grid-template-areas:
        "logo . ." 
        ". . tagline";
    }

    .logo h1{
        margin: 10px;
        grid-area: logo;
        font-family: 'Orbitron', sans-serif;
        color:#7BAFD4;
    }

    .logo h3{
        /* margin: 0px 180px 10px; */
        grid-area: tagline;
        font-family: 'Orbitron', sans-serif;
        color:#345D7E;
    }

    @media (max-width:1200px) {
        .boxContainer {
            margin: 0;
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
</style>