<script lang="ts">
    interface AutocompleteResult {
        tag: string;
        count?: number;
    }

    let searchTerm = $state('');
    let results = $state<AutocompleteResult[]>([]);
    let isLoading = $state(false);
    let highlightIndex = $state<number | null>(null);
    let showDropdown = $state(false);
    let inputRef = $state<HTMLInputElement | null>(null);
    let abortController = $state<AbortController | null>(null);

    // Derived: current term being typed (last in comma-separated list)
    let currentTerm = $derived(
        searchTerm.length < 2 
            ? '' 
            : searchTerm.toLowerCase().split(",").map(t => t.trim()).pop() || ''
    );

    // Derived: highlighted result
    let highlightedResult = $derived(highlightIndex !== null ? results[highlightIndex] ?? null : null);

    // Hide dropdown when no results or no term
    $effect(() => {
        showDropdown = results.length > 0 && currentTerm.length >= 2;
        if (!showDropdown) {
            highlightIndex = null;
        }
    });

    async function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = target.value;
        const terms = value.split(",");
        const query = terms[terms.length - 1].trim();

        if (query.length < 2) {
            results = [];
            highlightIndex = null;
            return;
        }

        // Cancel previous request
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        isLoading = true;
        try {
            const response = await fetch(`/api/autocomplete?tags=${encodeURIComponent(query)}`, {
                signal: abortController.signal
            });
            const data = await response.json();
            
            if (data.success && data.autocompleteResults) {
                results = data.autocompleteResults.slice(0, 8); // Limit to 8 results
                highlightIndex = null;
            } else {
                results = [];
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Autocomplete error:', err);
                results = [];
            }
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!showDropdown) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (highlightIndex === null || highlightIndex >= results.length - 1) {
                highlightIndex = 0;
            } else {
                highlightIndex += 1;
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (highlightIndex === null || highlightIndex === 0) {
                highlightIndex = results.length - 1;
            } else {
                highlightIndex -= 1;
            }
        } else if (e.key === "Enter" && highlightIndex !== null) {
            e.preventDefault();
            selectResult(results[highlightIndex]);
        } else if (e.key === "Escape") {
            results = [];
            highlightIndex = null;
        }
    }

    function selectResult(result: AutocompleteResult | string) {
        // Replace the last term with the selected result
        const terms = searchTerm.split(",");
        const tagValue = typeof result === 'string' ? result : result.tag;
        terms[terms.length - 1] = tagValue;
        searchTerm = terms.join(", ") + ", ";
        results = [];
        highlightIndex = null;
        inputRef?.focus();
    }

    function handleBlur() {
        // Delay to allow click events on dropdown items
        setTimeout(() => {
            results = [];
            highlightIndex = null;
        }, 150);
    }

    function handleFocus() {
        if (currentTerm.length >= 2 && results.length > 0) {
            showDropdown = true;
        }
    }
</script>

<form action="/posts" method="get">
    <div class="searchBar">
        <input 
            id="searchQueryInput" 
            type="text" 
            name="search" 
            placeholder="Search tags (comma-separated)" 
            bind:value={searchTerm} 
            bind:this={inputRef}
            oninput={handleInput}
            onkeydown={handleKeydown}
            onblur={handleBlur}
            onfocus={handleFocus}
            autocomplete="off"
        />
        <button id="searchQuerySubmit" type="submit">
            <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="var(--text-icon)" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
        </button>

        {#if showDropdown}
            <ul class="autocomplete-dropdown">
                {#each results as result, i}
                    <li 
                        class="autocomplete-item" 
                        class:active={highlightIndex === i}
                        onmousedown={() => selectResult(result)}
                        role="option"
                        aria-selected={highlightIndex === i}
                    >
                        {result.tag || result}
                        {#if result.count}
                            <span class="count">({result.count})</span>
                        {/if}
                    </li>
                {/each}
                {#if isLoading}
                    <li class="autocomplete-item loading">Loading...</li>
                {/if}
            </ul>
        {/if}
    </div>
</form>

<style>
    .searchBar {
        grid-area: searchbar;
        display: flex;
        flex-direction: row;
        align-items: center;
        border-radius: 25px;
        background: var(--bg-input);
        transition: background-color 0.3s ease;
        position: relative;
    }

    #searchQueryInput {
        background: #00000000;
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

    .autocomplete-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--bg-input, #fff);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 0 0 15px 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 100;
        max-height: 300px;
        overflow-y: auto;
    }

    .autocomplete-item {
        padding: 10px 20px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .autocomplete-item:hover {
        background: var(--bg-hover, #f0f0f0);
    }

    .autocomplete-item.active {
        background: var(--primary-color, DodgerBlue);
        color: white;
    }

    .autocomplete-item .count {
        font-size: 0.85em;
        opacity: 0.7;
    }

    .autocomplete-item.loading {
        color: var(--text-muted, #888);
        font-style: italic;
    }
</style>
