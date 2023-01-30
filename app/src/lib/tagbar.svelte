<script>
	import Tag from "./tag.svelte";

    let response = [{name: "Enderman", link:"https://www.google.com"},{name: "Enderman", link:"www.google.com"},{name: "Enderman", link:"www.google.com"},{},{}];
    // Get response and bulid tags based on response
    // Using a  test response for now
    // calculate common tags?
</script>

<ul>
    <div class="wrapper">
        <div class="searchBar">
            <input id="searchQueryInput" type="text" name="searchQueryInput" placeholder="Search" value="" />
                <button id="searchQuerySubmit" type="submit" name="searchQuerySubmit">
                    <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                    </svg>
                </button>
        </div>
    </div>
    <p>Tags</p>
    {#each response as tag }
        <Tag name = {tag.name} link = {tag.link}></Tag>
    {/each}
</ul>

<style>
    .wrapper {
        width:100%;
        max-width:31.25rem;
        margin: 0;
    }
    .searchBar {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    }

    #searchQueryInput {
    width: 100%;
    height: 2rem;
    background: #f5f5f5;
    outline: none;
    border: none;
    border-radius: 1.625rem;
    padding: 0 0 0 1.5rem;
    font-size: 1rem;
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

    p{
        font-size:25px;
        margin:0 0 5px;

    }

    ul{
        padding: 10px 10px 10px 10px;
        background-color: #45542d;
        max-height: 5%;
        min-width: 10%;
        margin: 0 .5% 0;
        border-radius: 5px;
    }

</style>
