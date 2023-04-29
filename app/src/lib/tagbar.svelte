<script>
    import Tag from "./tag.svelte";
    export let response = ["Test_tag","Test_tag","Test_tag","Test_tag","Test_tag","Test_tag"];

</script>


        <div class="wrapper">
            <div class="searchBar">
                <input id="searchQueryInput" type="text" name="searchQueryInput" placeholder="Search" value="" />
                    <button id="searchQuerySubmit" type="submit" name="searchQuerySubmit">
                        <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
                    </button>
            </div>
            <p>Tags</p>
            <ul>
                {#each response as tag }
                    <Tag name = {tag} link = "/{tag}"></Tag>
                {/each}
            </ul>
        </div>


<style>


    .wrapper {
        display:grid;
        
        grid-template-areas: 
            "searchbar"
            "title"
            "tags";

        grid-template-rows: 40px 80px 1fr;

        max-width: 31.25rem;
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
        .wrapper{
            display:none;
        }
    }

    .searchBar {
        grid-area: searchbar;
    width: 95%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 4px;
    }

    #searchQueryInput {
    width: 100%;
    height: 2rem;
    background: #ADD8E6;
    outline: none;
    border: none;
    border-radius: 1.625rem;
    padding: 0 0 0 1rem;
    font-size: .88rem;
    }

    #searchQuerySubmit {
    width: 3.5rem;
    height: 2.8rem;
    margin-left: -3.5rem;
    background: none;
    border: none;
    outline: none;
    }

    #searchQuerySubmit:hover {
    cursor: pointer;
    }

    ul{
        font-family: 'Montserrat', sans-serif;
    }

    p {
        font-family: 'Montserrat', sans-serif;
        margin: none;
        padding-left: 5px;
        padding: 0 5px 0 0;
        font-size: 2rem;
        color: #6494a3;

    }

        @media (max-width: 768px) {
        p {
            font-size: 1.5rem;
        }
        }

        @media (max-width: 480px) {
        p {
            font-size: 1rem;
        }
        }



</style>
