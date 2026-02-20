<script lang="ts">
    let { autocompleteTags = [], ontag }: { autocompleteTags?: string[]; ontag?: (tag: string) => void } = $props();
    
    let inputRef = $state<HTMLInputElement | null>(null);
    let inputValue = $state('');
    let filteredTags = $state<string[]>([]);
    let highlightIndex = $state<number | null>(null);
    let showDropdown = $state(false);

    // Derived: highlighted tag
    let highlightedTag = $derived(highlightIndex !== null ? filteredTags[highlightIndex] ?? '' : '');

    // Effect: hide dropdown when input is empty
    $effect(() => {
        if (!inputValue) {
            filteredTags = [];
            highlightIndex = null;
            showDropdown = false;
        }
    });

    const filterTags = () => {
        if (!inputValue) {
            filteredTags = [];
            showDropdown = false;
            return;
        }

        const storageArr: string[] = [];
        const lowerInput = inputValue.toLowerCase();

        for (const tag of autocompleteTags) {
            if (tag.toLowerCase().startsWith(lowerInput)) {
                storageArr.push(tag);
            }
            if (storageArr.length >= 5) {
                break;
            }
        }

        filteredTags = storageArr;
        showDropdown = storageArr.length > 0;
    };

    const clearInput = () => {
        inputValue = '';
        filteredTags = [];
        highlightIndex = null;
        showDropdown = false;
        inputRef?.focus();
    };

    const selectTag = (tag: string | null) => {
        const tagToDispatch = tag ?? inputValue;
        ontag?.(tagToDispatch);
        clearInput();
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (!showDropdown || filteredTags.length === 0) {
            if (e.key === "Enter" && inputValue) {
                e.preventDefault();
                selectTag(null);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (highlightIndex === null || highlightIndex >= filteredTags.length - 1) {
                highlightIndex = 0;
            } else {
                highlightIndex += 1;
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (highlightIndex === null || highlightIndex === 0) {
                highlightIndex = filteredTags.length - 1;
            } else {
                highlightIndex -= 1;
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            selectTag(filteredTags[highlightIndex ?? 0]);
        } else if (e.key === "Escape") {
            clearInput();
        }
    };

    const handleBlur = () => {
        // Delay to allow click events on dropdown items
        setTimeout(() => {
            filteredTags = [];
            highlightIndex = null;
            showDropdown = false;
        }, 150);
    };

    const handleFocus = () => {
        if (inputValue && filteredTags.length > 0) {
            showDropdown = true;
        }
    };
</script>

<div class="tag-input-wrapper">
    <input 
        id="tagAddInput"
        type="text"
        placeholder="Enter Tag:"
        bind:this={inputRef}
        bind:value={inputValue}
        onkeydown={handleKeydown}
        oninput={filterTags}
        onblur={handleBlur}
        onfocus={handleFocus}
        autocomplete="off"
    />
    
    {#if showDropdown && filteredTags.length > 0}
        <ul class="autocomplete-dropdown">
            {#each filteredTags as tag, i}
                <li 
                    class="autocomplete-item"
                    class:active={highlightIndex === i}
                    onmousedown={() => selectTag(tag)}
                    role="option"
                    aria-selected={highlightIndex === i}
                >
                    {tag}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .tag-input-wrapper {
        position: relative;
    }

    #tagAddInput {
        box-sizing: border-box;
        background: #f7d1d7;
        font-family: 'Montserrat', sans-serif;
        width: 100%;
        font-size: 14px;
        padding: 4px;
        outline: none;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    .autocomplete-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 100px;
        margin: 0;
        padding: 0;
        list-style: none;
        border: 1px solid #ddd;
        background-color: #fff;
        border-radius: 0 0 5px 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 99;
    }

    .autocomplete-item {
        padding: 5px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-bottom: 1px solid #d4d4d4;
        font-family: 'Montserrat', sans-serif;
        white-space: nowrap;
    }

    .autocomplete-item:last-child {
        border-bottom: none;
    }

    .autocomplete-item:hover {
        background-color: #81921f;
        color: white;
    }

    .autocomplete-item.active {
        background-color: DodgerBlue !important;
        color: #ffffff;
    }
</style>
