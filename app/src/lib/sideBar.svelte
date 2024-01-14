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
        width: 235px;
        margin: 0 .5%;
    }

    @media (max-width:960px) {
        .sideBar{
            display:none;
        }
    }

</style>