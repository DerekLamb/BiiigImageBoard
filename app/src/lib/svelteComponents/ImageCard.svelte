<script lang="ts">
    import Image from "$lib/image.svelte";
    import type { AppImage } from "$lib/types/DocTypes.js";

    interface Props {
        /** The image document to display */
        doc: AppImage;
        /** Optional fallback image URL */
        fallbackImage?: string;
        /** Whether group mode is active */
        groupMode?: boolean;
        /** Whether this image is selected */
        selected?: boolean;
    }

    let {
        doc,
        fallbackImage = "https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg",
        groupMode = false,
        selected = false
    }: Props = $props();

    const imageSrc = $derived(doc.thumbnailPath ? `/${doc.thumbnailPath}` : fallbackImage);
</script>

<div class="grid-item image-card" data-id={doc._id} class:selected>
    <slot {doc}>
        <Image
            src={imageSrc}
            mainLink="/posts/{doc.uploadDate}"
            alt={doc.originalName}
            thumbnail={true}
        />
    </slot>
</div>

<style>
    .grid-item {
        position: relative;
        border-radius: 4px;
        overflow: hidden;
        transition: transform 0.2s ease;
    }

    .grid-item:hover {
        transform: scale(1.02);
    }

    .grid-item.selected {
        outline: 3px solid #4a90e2;
        outline-offset: 2px;
    }
</style>
