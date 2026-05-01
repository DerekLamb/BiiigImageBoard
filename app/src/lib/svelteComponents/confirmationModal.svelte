<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let show: boolean = false;
    export let title: string = "Confirm Action";
    export let message: string = "Are you sure you want to proceed?";
    export let confirmText: string = "Confirm";
    export let cancelText: string = "Cancel";
    export let danger: boolean = false;

    const dispatch = createEventDispatcher();

    function handleConfirm() {
        dispatch('confirm');
    }

    function handleCancel() {
        dispatch('cancel');
    }
</script>

{#if show}
    <dialog class="confirmation-modal" on:close={() => dispatch('cancel')} on:click|self={() => dispatch('cancel')}>
        <div class="modal-content">
            <h3>{title}</h3>
            <p>{message}</p>
            <div class="modal-actions">
                <button class="cancel-btn" on:click={handleCancel}>{cancelText}</button>
                <button class="{danger ? 'danger-btn' : 'confirm-btn'}" on:click={handleConfirm}>{confirmText}</button>
            </div>
        </div>
    </dialog>
{/if}

<style>
    .confirmation-modal {
        max-width: 32em;
        border-radius: 0.2em;
        border: none;
        padding: 0;
    }
    
    .confirmation-modal::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }
    
    .confirmation-modal[open] {
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
    
    .confirmation-modal[open]::backdrop {
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
    
    .modal-content p {
        color: var(--text-secondary);
        margin-bottom: 1em;
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
    
    .confirm-btn {
        background-color: var(--button-bg);
        color: var(--button-text);
    }
    
    .confirm-btn:hover {
        background-color: var(--button-hover);
        color: var(--button-text);
    }
    
    .danger-btn {
        background-color: var(--button-primary);
        color: var(--button-text);
    }
    
    .danger-btn:hover {
        background-color: var(--button-hover);
        color: var(--button-primary);
    }
</style>