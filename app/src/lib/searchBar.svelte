<script>
    import { improvSearch } from '$lib/stores/searchStore';

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
        <input id="searchQueryInput" type="text" name="search" placeholder="Search" bind:value={$improvSearch} />
            <button id="searchQuerySubmit" type="submit">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="var(--text-icon)" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
            </button>
    </div>
</form>

<style>
    .searchBar {
        grid-area: searchbar;
        display:flex;
        flex-direction: row;
        align-items: center;
        border-radius:25px;
        background: var(--bg-input);
        transition: background-color 0.3s ease;
    }

    #searchQueryInput {
        background:#00000000;
        box-sizing: border-box;
        height: 50px;
        outline: none;
        border: none;
        padding: 0 55px 0 20px;
        font-size: 16px;
        width: 100%;
    }

    #searchQuerySubmit {
        margin-left: -3.5rem;
        background: none;
        border: none;
        outline: none;
    }

    #searchQuerySubmit:hover {
        cursor: pointer;
    }
</style>