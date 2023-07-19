<script>
    import { search } from '$lib/stores/searchStore';

    function onSubmit(e) {
        const formData = new FormData(e.target);
        const data = {};

        for(let field of formData){
            const [key, value] = field;
            data[key] = value;
        }
        console.log(data);
    }

</script>

<form action="/posts" >
    <div class="searchBar">
        <input id="searchQueryInput" type="text" name="search" placeholder="Search" bind:value={$search} />
            <button id="searchQuerySubmit" type="submit">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
            </button>
    </div>
</form>

<style>
    .searchBar {
        grid-area: searchbar;
        width:95%;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding-left: 4px;
    }

    #searchQueryInput {
        width: 100%;
        height: 2.5rem;
        background: #d6f8ef;
        outline: none;
        border: none;
        border-radius: 1.625rem;
        padding: 0 50px 0 1rem;
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
</style>