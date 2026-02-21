<script lang="ts">
    import GroupThmb from "$lib/svelteComponents/groupThmb.svelte";
    import type { AppGroup } from "$lib/types/DocTypes.js";

    interface Props {
        /** The group document to display */
        doc: AppGroup;
        /** Optional fallback image URL */
        fallbackImage?: string;
        /** Whether group mode is active */
        groupMode?: boolean;
    }

    let {
        doc,
        fallbackImage = "https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg",
        groupMode = false
    }: Props = $props();

    const thumbnailSrc = $derived(doc.thumbnailPaths?.[0] ?? fallbackImage);
</script>

<div class="grid-item group-card" data-id={doc._id}>
    <div>{doc.name}</div>
    <slot {doc}>
        <GroupThmb
            anchorLink="/postGroups/{doc._id}"
            thmbSrc={thumbnailSrc}
            name={doc.name}
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

    /* Groups have a distinct border in group mode */
    .group-card {
        border: 2px solid #9b59b6;
    }
</style>
