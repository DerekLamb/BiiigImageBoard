<script lang="ts">
    import GroupCard from "$lib/svelteComponents/GroupCard.svelte";
    import ImageCard from "$lib/svelteComponents/ImageCard.svelte";
    import { dragDropItem } from "$lib/actions/dragDrop";
    import type { AppContent, AppImage, AppGroup } from "$lib/types/DocTypes.js";

    // Props
    interface Props {
        /** Array of documents (images and/or groups) to display */
        documents?: AppContent[];
        /** Current view mode: 'browse' | 'select' | 'groupDetail' */
        mode?: string;
        /** Whether group mode is active (enables drag-drop and selection) */
        groupMode?: boolean;
        /** Set of selected image IDs */
        selectedIds?: Set<string>;
        /** Called when an image is selected/deselected */
        onToggleSelection?: (id: string) => void;
        /** Called when a drop occurs (for group creation) */
        onDrop?: (sourceId: string, targetId: string) => void;
    }

    let {
        documents = [],
        minSize = 200,
        mode = 'browse',
        groupMode = false,
        selectedIds = new Set<string>(),
        onToggleSelection,
        onDrop
    }: Props = $props();

    // Type guards
    function isGroup(doc: AppContent): doc is AppGroup {
        return 'groupType' in doc;
    }

    // Drag-drop handlers
    function handleDragStart(id: string, event: DragEvent) {
        // Visual feedback handled by CSS class
    }

    function handleDragEnd(id: string, event: DragEvent) {
        // Cleanup handled by action
    }

    function handleDrop(sourceId: string, targetId: string, event: DragEvent) {
        onDrop?.(sourceId, targetId);
    }

    // Selection handler
    function handleToggleSelection(id: string) {
        onToggleSelection?.(id);
    }
</script>

<div class="content-grid" class:group-mode={groupMode} style = "grid-template-columns: repeat(auto-fit, minmax({minSize}px, 1fr)">
    {#each documents as doc (doc._id)}
        {#if isGroup(doc)}
            <GroupCard {doc} {groupMode}>
            </GroupCard>
        {:else}
            <div
                class="grid-item-wrapper"
                class:selected={groupMode && selectedIds.has(doc._id)}
                use:dragDropItem={{
                    id: doc._id,
                    draggingClass: 'dragging',
                    dragOverClass: 'drag-over',
                    onDragStart: handleDragStart,
                    onDragEnd: handleDragEnd,
                    onDrop: handleDrop
                }}
            >
                <ImageCard {doc} {groupMode} selected={selectedIds.has(doc._id)}>
                </ImageCard>
                {#if groupMode}
                    <div class="selection-overlay" onclick={() => handleToggleSelection(doc._id)}>
                        <input
                            type="checkbox"
                            checked={selectedIds.has(doc._id)}
                            onclick={(e) => e.stopPropagation()}
                            onchange={() => handleToggleSelection(doc._id)}
                        />
                    </div>
                {/if}
            </div>
        {/if}
    {:else}
        <div class="empty-state">
            <slot name="empty">
                <p>No content to display</p>
            </slot>
        </div>
    {/each}
</div>

<style>
    .content-grid {
        display: grid;
        gap: 10px;
        width: 100%;
    }

    .grid-item-wrapper {
        position: relative;
        border-radius: 4px;
        transition: outline 0.2s ease, transform 0.2s ease;
    }

    .grid-item-wrapper.selected {
        outline: 3px solid #4a90e2;
        outline-offset: 2px;
    }

    .grid-item-wrapper.selected::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(74, 144, 226, 0.1);
        border-radius: 4px;
        z-index: 5;
        pointer-events: none;
    }

    .grid-item-wrapper:global(.dragging) {
        opacity: 0.5;
        transform: scale(0.95);
    }

    .grid-item-wrapper:global(.drag-over) {
        outline: 3px dashed #2ecc71;
        outline-offset: 4px;
        background-color: rgba(46, 204, 113, 0.1);
    }

    .selection-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
        cursor: pointer;
    }

    .selection-overlay input {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #4a90e2;
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #666;
    }
</style>
