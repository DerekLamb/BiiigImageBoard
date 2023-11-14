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
        grid-template-rows: 40px 8fr;
        gap: 20px;
        max-width: 250px;
        min-width: 10%;
        margin: 0 .5%;
    }

    @media (max-width:960px) {
        .sideBar{
            display:none;
        }
    }

</style>