<script lang="ts">
    import ContentGrid from '$lib/svelteComponents/contentGrid.svelte';
    import SideBar from '$lib/sideBar.svelte';
    import SearchBar from '$lib/searchBar.svelte';
    import TagSection from '$lib/tagSection.svelte';
    import PageNav from '$lib/pageNav.svelte';
    import type { UploadEvent } from '$lib/types/DocTypes.js';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    interface DataResponse {
        events: UploadEvent[];
        totalEvents: number;
        totalImagesScanned: number;
        thresholdMinutes: number;
        scanLimit: number;
        skip: number;
    }

    interface Props {
        data: DataResponse;
    }

    let { data }: Props = $props();

    let baseUrl = '/postsByDate';
    let selectedThreshold = $state(data.thresholdMinutes);

    let currentPage = $state(1);

    const thresholdOptions = [
        { value: 15, label: '15 min' },
        { value: 30, label: '30 min' },
        { value: 60, label: '1 hour' },
        { value: 120, label: '2 hours' },
        { value: 240, label: '4 hours' },
        { value: 480, label: '8 hours' },
        { value: 1440, label: '24 hours' },
        { value: 2880, label: '48 hours' },
    ];

    function applyThreshold() {
        const url = new URL($page.url);
        url.searchParams.set('threshold', selectedThreshold.toString());
        url.searchParams.set('skip', '0');
        goto(url);
    }
</script>

<div class="midContainer">
    <SideBar itemCount={3}>
        <SearchBar />
        <div class="event-settings">
            <h3 class="settings-title">Upload Events</h3>
            <label class="threshold-label" for="threshold-select">
                Event gap:
            </label>
            <select
                id="threshold-select"
                bind:value={selectedThreshold}
                onchange={applyThreshold}
            >
                {#each thresholdOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
            <p class="event-stats">
                {data.totalEvents} events from {data.totalImagesScanned} images
            </p>
        </div>
        <TagSection imageTags={[]} editable={false} />
    </SideBar>

    <div class="content-area">
        <PageNav {baseUrl} currentPage={currentPage} totalPages={1} />

        <ContentGrid
            documents={data.events ?? []}
            mode="browse"
            minSize={220}
        />

        <div class="no-more">
            {#if data.events.length === 0}
                <p>No upload events found. Try a smaller threshold.</p>
            {:else}
                <p>Showing {data.events.length} upload events</p>
            {/if}
        </div>
    </div>
</div>

<style>
    .midContainer {
        display: grid;
        height: 100%;
    }

    @media (min-width: 960px) {
        .midContainer {
            grid-template-columns: 1fr 4fr;
        }
    }

    .content-area {
        padding: 10px;
    }

    .event-settings {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .settings-title {
        font-size: 0.95rem;
        color: #555;
        margin: 0 0 10px 0;
        font-weight: 600;
    }

    .threshold-label {
        display: block;
        font-size: 0.85rem;
        color: #777;
        margin-bottom: 4px;
    }

    #threshold-select {
        width: 100%;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid #ddd;
        font-size: 0.9rem;
        background: var(--bg-input, #fff);
        color: #345D7E;
        font-family: 'Montserrat', sans-serif;
    }

    .event-stats {
        font-size: 0.8rem;
        color: #999;
        margin-top: 8px;
    }

    .no-more {
        text-align: center;
        padding: 20px;
        color: #888;
    }
</style>
