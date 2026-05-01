/**
 * Drag and Drop Actions for Svelte
 * 
 * Provides reusable drag-and-drop functionality for creating groups
 * and reordering content in the ContentGrid component.
 */

// Configuration types
export interface DraggableOptions {
    /** Unique identifier for the draggable element */
    id: string;
    /** Called when drag starts */
    onDragStart?: (id: string, event: DragEvent) => void;
    /** Called when drag ends */
    onDragEnd?: (id: string, event: DragEvent) => void;
    /** CSS class added while dragging */
    draggingClass?: string;
}

export interface DropZoneOptions {
    /** Called when a dragged item enters the zone */
    onDragEnter?: (id: string, event: DragEvent) => void;
    /** Called when a dragged item leaves the zone */
    onDragLeave?: (id: string, event: DragEvent) => void;
    /** Called when an item is dropped */
    onDrop?: (sourceId: string, targetId: string, event: DragEvent) => void;
    /** CSS class added when a valid drag is over */
    dragOverClass?: string;
}

/**
 * Makes an element draggable.
 * 
 * Usage:
 * ```svelte
 * <div use:draggable={{ id: item.id, onDragStart, onDragEnd }}>
 * ```
 */
export function draggable(node: HTMLElement, options: DraggableOptions) {
    const { id, onDragStart, onDragEnd, draggingClass = 'dragging' } = options;

    node.setAttribute('draggable', 'true');
    node.setAttribute('data-drag-id', id);

    function handleDragStart(event: DragEvent) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', id);
            event.dataTransfer.effectAllowed = 'move';
        }
        node.classList.add(draggingClass);
        onDragStart?.(id, event);
    }

    function handleDragEnd(event: DragEvent) {
        node.classList.remove(draggingClass);
        onDragEnd?.(id, event);
    }

    node.addEventListener('dragstart', handleDragStart);
    node.addEventListener('dragend', handleDragEnd);

    return {
        update(newOptions: DraggableOptions) {
            // Update the id if it changed
            if (newOptions.id !== id) {
                node.setAttribute('data-drag-id', newOptions.id);
            }
        },
        destroy() {
            node.removeAttribute('draggable');
            node.removeAttribute('data-drag-id');
            node.removeEventListener('dragstart', handleDragStart);
            node.removeEventListener('dragend', handleDragEnd);
        }
    };
}

/**
 * Makes an element a drop zone for draggable items.
 * 
 * Usage:
 * ```svelte
 * <div use:dropZone={{ onDragEnter, onDragLeave, onDrop }}>
 * ```
 */
export function dropZone(node: HTMLElement, options: DropZoneOptions) {
    const { onDragEnter, onDragLeave, onDrop, dragOverClass = 'drag-over' } = options;
    
    let isDragOver = false;

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDragEnter(event: DragEvent) {
        event.preventDefault();
        const targetId = node.getAttribute('data-drag-id');
        
        if (!isDragOver) {
            isDragOver = true;
            node.classList.add(dragOverClass);
            if (targetId) {
                onDragEnter?.(targetId, event);
            }
        }
    }

    function handleDragLeave(event: DragEvent) {
        const targetId = node.getAttribute('data-drag-id');
        
        // Only trigger if we're actually leaving the element
        if (!node.contains(event.relatedTarget as Node)) {
            isDragOver = false;
            node.classList.remove(dragOverClass);
            if (targetId) {
                onDragLeave?.(targetId, event);
            }
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragOver = false;
        node.classList.remove(dragOverClass);

        const sourceId = event.dataTransfer?.getData('text/plain');
        const targetId = node.getAttribute('data-drag-id');

        if (sourceId && targetId && sourceId !== targetId) {
            onDrop?.(sourceId, targetId, event);
        }
    }

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragenter', handleDragEnter);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);

    return {
        update(newOptions: DropZoneOptions) {
            // Options are reactive through closure
        },
        destroy() {
            node.removeEventListener('dragover', handleDragOver);
            node.removeEventListener('dragenter', handleDragEnter);
            node.removeEventListener('dragleave', handleDragLeave);
            node.removeEventListener('drop', handleDrop);
        }
    };
}

/**
 * Combined draggable + dropZone for grid items that can both be dragged
 * and receive drops (for group creation).
 * 
 * Usage:
 * ```svelte
 * <div use:dragDropItem={{ id: item.id, onDrop }}>
 * ```
 */
export function dragDropItem(
    node: HTMLElement, 
    options: DraggableOptions & DropZoneOptions
) {
    const draggableResult = draggable(node, options);
    const dropZoneResult = dropZone(node, options);

    return {
        update(newOptions: DraggableOptions & DropZoneOptions) {
            draggableResult.update(newOptions);
            dropZoneResult.update(newOptions);
        },
        destroy() {
            draggableResult.destroy?.();
            dropZoneResult.destroy?.();
        }
    };
}
