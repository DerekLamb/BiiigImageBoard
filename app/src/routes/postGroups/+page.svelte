<script lang="ts">
    
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";

/** @type {import('./$types').PageData} */ 


interface ServerData {
    groups:{
        name: string, 
        uploadDate: string, 
        children: string[], 
        groups: string[], 
        groupType: string, 
        groupTags: string[], 
    }[];
    pageNum: number;
    currPage: number;
    length: number;
    searchTerm: string;
}

export let data : ServerData;



</script>

<div class = midContainer>
    <SideBar>
        <SearchBar />
        <TagSection editable = {false} />
    </SideBar>
    <div class = "groupBrowser">
        {#each data.groups as group}
            <p><group class="name"></group></p>
    </div>
</div>