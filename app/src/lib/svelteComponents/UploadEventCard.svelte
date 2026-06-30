<script lang="ts">
    import type { UploadEvent } from "$lib/types/DocTypes.js";

    interface Props {
        doc: UploadEvent;
        fallbackImage?: string;
    }

    let {
        doc,
        fallbackImage = "https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg"
    }: Props = $props();

    function formatDate(ts: string): string {
        const d = new Date(parseInt(ts));
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatTime(ts: string): string {
        const d = new Date(parseInt(ts));
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDuration(startTs: string, endTs: string): string {
        const diffMs = parseInt(endTs) - parseInt(startTs);
        if (diffMs < 60000) return '< 1 min';
        const mins = Math.round(diffMs / 60000);
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (remainingMins === 0) return `${hours}h`;
        return `${hours}h ${remainingMins}m`;
    }

    function formatDateRange(startTs: string, endTs: string): string {
        const startDate = new Date(parseInt(startTs));
        const endDate = new Date(parseInt(endTs));

        const sameDay = startDate.toDateString() === endDate.toDateString();

        if (sameDay) {
            return `${formatDate(startTs)}, ${formatTime(startTs)} — ${formatTime(endTs)}`;
        }
        return `${formatDate(startTs)} ${formatTime(startTs)} — ${formatDate(endTs)} ${formatTime(endTs)}`;
    }

    const thumbnailSrc = $derived(doc.thumbnailPaths?.[0] ?? fallbackImage);
    const dateRange = $derived(formatDateRange(doc.startDate, doc.endDate));
    const duration = $derived(formatDuration(doc.startDate, doc.endDate));
    const link = $derived(`/postsByDate/${doc.startDate}`);
</script>

<a href={link} class="event-card-link">
    <div class="event-card" data-id={doc._id}>
        <div class="event-header">
            <span class="event-count">{doc.imageCount} images</span>
            <span class="event-duration">{duration}</span>
        </div>
        <div class="event-preview">
            {#if doc.thumbnailPaths.length > 0}
                <div class="thumb-grid" class:multi={doc.thumbnailPaths.length > 1}>
                    {#each doc.thumbnailPaths.slice(0, 4) as tmb, i}
                        <div class="thumb-cell" class:overflow={i === 3 && doc.imageCount > 4}>
                            <img src="/{tmb}" alt="event thumbnail" loading="lazy" />
                            {#if i === 3 && doc.imageCount > 4}
                                <div class="overflow-count">+{doc.imageCount - 4}</div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <img class="single-thumb" src={fallbackImage} alt="fallback" />
            {/if}
        </div>
        <div class="event-footer">
            <span class="event-date">{dateRange}</span>
        </div>
    </div>
</a>

<style>
    .event-card-link {
        text-decoration: none;
        color: inherit;
    }

    .event-card {
        border: 2px solid #f39c12;
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-card, #fff);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        flex-direction: column;
    }

    .event-card:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
    }

    .event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: #fef5e7;
        border-bottom: 1px solid #fdebd0;
    }

    .event-count {
        font-weight: 600;
        font-size: 0.9rem;
        color: #e67e22;
    }

    .event-duration {
        font-size: 0.8rem;
        color: #888;
    }

    .event-preview {
        width: 100%;
        aspect-ratio: 16 / 10;
        overflow: hidden;
        position: relative;
    }

    .thumb-grid {
        display: grid;
        width: 100%;
        height: 100%;
    }

    .thumb-grid.multi {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
    }

    .thumb-cell {
        position: relative;
        overflow: hidden;
    }

    .thumb-cell img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .overflow-count {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .single-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .event-footer {
        padding: 8px 10px;
        background: #fef5e7;
        border-top: 1px solid #fdebd0;
    }

    .event-date {
        font-size: 0.8rem;
        color: #666;
    }
</style>
