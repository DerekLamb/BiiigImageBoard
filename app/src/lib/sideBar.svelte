<script>
    let tags = [];
    let colorScheme = [];
</script>



    <div class="sideBar">
        <slot>
        </slot>
    </div>

<style>

.sideBar {
        display:grid;
        grid-template-areas: 
            "searchbar"
            "title"
            "tags";

        grid-template-rows: 40px 8fr;
        gap: 20px;
        max-width: 18rem;
        min-width: 10%;
        width: 100%;
        margin: 0 .5%;
        padding: 5px;

    }

    @media (max-width:820px) {
        .sideBar{
            display:none;
        }
    }

</style>