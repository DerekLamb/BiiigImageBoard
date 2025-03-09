<script>
    let tags = [];
    let colorScheme = [];
    export let itemCount = 2;
</script>



    <div class="sideBar" style="--item-count: {itemCount} ">
        <slot>
        </slot>
    </div>

<style>

.sideBar {
        display:grid;
        grid-template-rows: repeat(calc(var(--item-count) - 1) , 40px) 1fr;
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