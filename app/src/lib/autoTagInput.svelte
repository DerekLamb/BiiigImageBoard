<script lang=ts>
    import { createEventDispatcher } from "svelte";
    // https://svelte.dev/repl/5734f123973d4682978427024ca90850?version=3.29.0

    export let autocompleteTags: string[] = []; // Should be an array sorted by popularity
    export let filteredTags: string[] = [];
    const dispatch = createEventDispatcher();
    let searchInput: any; // bind:this on the tag element
    let inputValue = "";
    let highlightIndex: null | number = null;
    let highlightedTag = "";

    const filterTags = () => { // builds the filtered list of tags to display, may add adjustable limit
        let storageArr = [];
        if( inputValue ) {

            for (const tag of autocompleteTags) {
                if( tag.toLowerCase().startsWith(inputValue.toLowerCase()) ) {
                    storageArr.push(tag);
                }
                if( storageArr.length >= 5 ) {
                    break;
                }
            }
        }
        filteredTags = storageArr;
    }

    $: if (!inputValue) { // clears the filtered list when the input is empty
        filteredTags = [];
        highlightIndex = null;
    }


    const clearInput = () => { // clears the input field
        inputValue = "";
        searchInput.focus();
    }

    const handleInputVal = (tag) => { // sets the input value to the selected tag
        if(highlightIndex !== null) { 
            dispatch("tag", {tag: tag});
            clearInput();
        } else {
            dispatch("tag", {tag: inputValue});
            clearInput();
        }
        filteredTags = [];
        highlightIndex = null;
        document.querySelector('#tagAddInput').focus();
    }

    $: highlightedTag = filteredTags[highlightIndex] ?? ""; 
    //$: console.log(highlightIndex)

    const navigateList = (e) => { // handles keyboard navigation of the list
        if (e.key === "ArrowDown" && highlightIndex < filteredTags.length-1) {
            highlightIndex === null ? highlightIndex = 0 : highlightIndex += 1
        } else if (e.key === "ArrowUp" && highlightIndex !== null) {
            highlightIndex === 0 ? highlightIndex = filteredTags.length-1 : highlightIndex -= 1
        } else if (e.key === "Enter") {
            handleInputVal(filteredTags[highlightIndex]);
        } else if (e.key === "Escape") {
            clearInput();
        } else {
            return;
        }
    } 



</script>


<div>
    <input id="tagAddInput"
            type="text"
            placeholder="Enter Tag:"
            bind:this={searchInput}
            bind:value = {inputValue}
            on:keydown={navigateList}
            on:input={filterTags}>
    
    <div class="tagInputContainer">
        {#if filteredTags.length > 0}
            <ul id="autocomplete-items-list">
                {#each filteredTags as tag, i}
                    <li  class="autocomplete-items" class:autocomplete-active={highlightIndex == i}>{tag}</li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
#tagAddInput {
    box-sizing: border-box;
    background: #f7d1d7;
    font-family: 'Montserrat', sans-serif;
    width: 100%;
    font-size:14px;
    padding: 4px;
    outline: none;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.tagInputContainer {
    position: relative;

}

#autocomplete-items-list {
    position: absolute;
	margin: 0;
	padding: 0;
	top: 0;
	width: 100px;
	border: 1px solid #ddd;
	background-color: #ddd;
}	

li.autocomplete-items {
    list-style: none;
    border-bottom: 1px solid #d4d4d4;
    font-family: 'Montserrat', sans-serif;
    z-index: 99;
    position:relative;
    /*position the autocomplete items to be the same width as the container:*/
    top: 100%;
    left: 0;
    right: 0;
    padding: 5px 12px;
    cursor: pointer;
    background-color: #fff;
    transition: background-color 0.2s;
}

li.autocomplete-items:hover {
    /*when hovering an item:*/
    background-color: #81921f;
        color: white;
}

li.autocomplete-active {
    /*when navigating through the items using the arrow keys:*/
    background-color: DodgerBlue !important;
    color: #ffffff;
}	
</style>