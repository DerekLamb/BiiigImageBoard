<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    export let show: boolean = false;
    export let selectedGroupId: string | null = null;
    export let onSelect: (groupId: string) => void = () => {};

    let groups: Array<{ id: string; name: string }> = [];
    let loading = false;
    let dialogBox: HTMLDialogElement | null = null;

    onMount(async () => {
        if (show) {
            loadGroups();
        }
    });

    async function loadGroups() {
        loading = true;
        try {
            const response = await fetch('/api/groups');
            if (response.ok) {
                const data = await response.json();
                groups = data.groups.map((g: any) => ({
                    id: g._id.toString(),
                    name: g.name
                }));
            }
        } catch (err) {
            console.error('Error loading groups:', err);
        } finally {
            loading = false;
        }
    }

    function handleClose() {
        show = false;
    }

    function handleSelect(groupId: string) {
        onSelect(groupId);
        handleClose();
    }

    function handleCreateNew() {
        // Navigate to group creation page or open create modal
        handleClose();
        // For now, just close - the parent component should handle this
    }
</script>

{#if show}
    <dialog bind:this={dialogBox} class="group-select-modal" on:close={handleClose} on:click|self={handleClose}>
        <div class="modal-content">
            <h3>Select Group</h3>
            
            {#if loading}
                <p>Loading groups...</p>
            {:else if groups.length === 0}
                <p>No groups found. Create a group first.</p>
            {:else}
                <div class="groups-list">
                    {#each groups as group}
                        <button 
                            class="group-item {group.id === selectedGroupId ? 'selected' : ''}"
                            on:click={() => handleSelect(group.id)}
                        >
                            {group.name}
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="modal-actions">
                <button class="cancel-btn" on:click={handleClose}>Cancel</button>
                <button class="create-btn" on:click={handleCreateNew}>Create New Group</button>
            </div>
        </div>
    </dialog>
{/if}

<style>
    .group-select-modal {
        max-width: 32em;
        border-radius: 0.2em;
        border: none;
        padding: 0;
    }
    
    .group-select-modal::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }
    
    .group-select-modal[open] {
        animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    @keyframes zoom {
        from {
            transform: scale(0.95);
        }
        to {
            transform: scale(1);
        }
    }
    
    .group-select-modal[open]::backdrop {
        animation: fade 0.2s ease-out;
    }
    
    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .modal-content {
        padding: 1em;
    }
    
    .modal-content h3 {
        margin-top: 0;
        margin-bottom: 0.5em;
        color: var(--text-primary);
    }
    
    .groups-list {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 1em;
    }
    
    .group-item {
        display: block;
        width: 100%;
        padding: 0.75em 1em;
        margin-bottom: 0.25em;
        border-radius: 0.25em;
        border: 1px solid var(--border-color);
        background-color: var(--bg-card);
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
    }
    
    .group-item:hover {
        background-color: var(--bg-accent);
        color: var(--text-primary);
        border-color: var(--bg-accent);
    }
    
    .group-item.selected {
        background-color: var(--button-bg);
        color: var(--button-text);
        border-color: var(--button-bg);
    }
    
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5em;
    }
    
    button {
        padding: 0.5em 1em;
        border-radius: 0.25em;
        border: none;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
    }
    
    .cancel-btn {
        background-color: var(--bg-input);
        color: var(--text-secondary);
    }
    
    .cancel-btn:hover {
        background-color: var(--bg-accent);
        color: var(--text-primary);
    }
    
    .create-btn {
        background-color: var(--button-bg);
        color: var(--button-text);
    }
    
    .create-btn:hover {
        background-color: var(--button-hover);
        color: var(--button-text);
    }
</style>