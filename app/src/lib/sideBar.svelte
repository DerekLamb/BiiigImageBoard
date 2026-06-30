<script>
    export let itemCount = 2;
</script>



    <div class="sideBar" style="--item-count: {itemCount} ">
        <slot>
        </slot>
    </div>

<style>

.sideBar {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 235px;
        margin: 0 .5%;
    }


    @media (max-width:960px) {
        .sideBar{
            display:none;
        }
    }

</style>