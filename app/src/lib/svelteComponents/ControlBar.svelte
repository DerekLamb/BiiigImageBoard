<script lang="ts">
    import DropDown from "$lib/svelteComponents/dropDown.svelte";
    import { improvImageSize, imageCount } from "$lib/stores/searchStore";

    // Props
    interface Props {
        /** Current view mode: 'browse' | 'select' | 'groupDetail' */
        mode?: 'browse' | 'select' | 'groupDetail';
        /** Whether group mode is active */
        groupMode?: boolean;
        /** Number of selected items */
        selectionCount?: number;
        /** Available image size options */
        sizeOptions?: number[];
        /** Available items per page options */
        countOptions?: number[];
    }

    let {
        mode = 'browse',
        groupMode = false,
        selectionCount = 0,
        sizeOptions = [100, 110, 150, 200, 300],
        countOptions = [24, 32, 48, 60, 72, 84, 96]
    }: Props = $props();

    // Event handlers - these emit events to parent
    function toggleGroupMode() {
        // Emit toggle-group-mode event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('toggle-group-mode'));
        }
    }

    function selectAll() {
        window.dispatchEvent(new CustomEvent('select-all'));
    }

    function clearSelection() {
        window.dispatchEvent(new CustomEvent('clear-selection'));
    }

    function addToGroup() {
        window.dispatchEvent(new CustomEvent('add-to-group'));
    }

    function deleteSelected() {
        window.dispatchEvent(new CustomEvent('delete-selected'));
    }
</script>

<div class="control-bar">
    <!-- View Mode Toggle -->
    <button
        class="group-button"
        class:active={groupMode}
        onclick={toggleGroupMode}
        aria-pressed={groupMode}
    >
        {groupMode ? 'Exit Group Mode' : 'Enter Group Mode'}
    </button>

    <!-- Conditional Group Controls (shown in select mode) -->
    {#if groupMode}
        <div class="group-controls">
            <button onclick={selectAll}>Select All</button>
            <button onclick={clearSelection}>Clear Selection</button>
            <span class="selected-count" aria-live="polite">
                {selectionCount} selected
            </span>
            <button
                class="add-to-group-btn"
                onclick={addToGroup}
                disabled={selectionCount === 0}
            >
                Add to Group
            </button>
            <button
                class="delete-btn"
                onclick={deleteSelected}
                disabled={selectionCount === 0}
            >
                Delete Selected
            </button>
        </div>
    {/if}

    <!-- Size and Count Dropdowns -->
    <div class="dropdown-controls">
        <DropDown
            label="Image Size"
            options={sizeOptions}
            bind:selectedValue={$improvImageSize}
        />
        <DropDown
            label="Image Count"
            options={countOptions}
            bind:selectedValue={$imageCount}
        />
    </div>
</div>

<style>
    .control-bar {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 10px;
        background-color: #f0f0f0;
        border-radius: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }

    .group-button {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
    }

    .group-button:hover {
        background-color: #3a7bc8;
    }

    .group-button.active {
        background-color: #e74c3c;
    }

    .group-button.active:hover {
        background-color: #c0392b;
    }

    .group-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .group-controls button {
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        transition: background-color 0.2s;
    }

    .group-controls button:hover:not(:disabled) {
        background-color: #e8e8e8;
    }

    .selected-count {
        background-color: #4a90e2;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-family: 'Montserrat', sans-serif;
    }

    .add-to-group-btn {
        background-color: #2ecc71 !important;
        color: white;
        border-color: #27ae60 !important;
    }

    .add-to-group-btn:hover:not(:disabled) {
        background-color: #27ae60 !important;
    }

    .add-to-group-btn:disabled,
    .delete-btn:disabled {
        background-color: #ccc !important;
        color: #888;
        cursor: not-allowed;
        border-color: #bbb !important;
    }

    .delete-btn {
        background-color: #e74c3c !important;
        color: white;
        border-color: #c0392b !important;
    }

    .delete-btn:hover:not(:disabled) {
        background-color: #c0392b !important;
    }

    .dropdown-controls {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-left: auto;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .control-bar {
            flex-direction: column;
            align-items: stretch;
        }

        .dropdown-controls {
            margin-left: 0;
            justify-content: center;
        }
    }
</style>
