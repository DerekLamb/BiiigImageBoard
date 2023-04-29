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

        grid-template-rows: 40px 8fr 1fr;
        gap: 20px;
        max-width: 28rem;
        min-width: 10%;
        width: 100%;
        margin: 0 .5%;
        padding: 5px;
        background-color: #9ac7d6;
        border: 2px solid #65ccc744;
        border-radius: 8px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.205);
    }

    @media (max-width:767px) {
        .sideBar{
            display:none;
        }
    }

</style>