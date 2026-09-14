<script lang="ts">
	import { parse as devalueParse } from 'devalue';
	import AutoTagInput from '$lib/autoTagInput.svelte';
	import Tag from '$lib/tag.svelte';

	interface UploadItem {
		file: File;
		name: string;
		tags: string[];
		size: string;
		previewImage: string;
	}

	interface UploadResult {
		status: 'fulfilled' | 'rejected';
		value?: any;
		reason?: unknown;
	}

	type ItemStatus = 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';

	interface Summary {
		successes: number;
		duplicates: number;
		failures: number;
	}

	const ACCEPTED = ['image/', 'video/mp4', 'video/webm'];
	const CONCURRENCY = 16;

	let uploadQueue: UploadItem[] = $state([]);
	let isUploading = $state(false);
	let isDragOver = $state(false);
	let results: (UploadResult | undefined)[] = $state([]);
	let finishedCount = $state(0);
	let lastSummary: Summary | null = $state(null);
	let fileInput: HTMLInputElement;

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function addFiles(list: FileList | File[]) {
		const files = Array.from(list);
		for (const file of files) {
			if (!ACCEPTED.some((prefix) => file.type.startsWith(prefix))) continue;
			uploadQueue.push({
				file: file,
				name: file.name,
				tags: [],
				size: formatSize(file.size),
				previewImage: URL.createObjectURL(file)
			});
		}
		lastSummary = null;
	}

	function handleInputChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		if (target.files) addFiles(target.files);
		target.value = ''; // allow re-selecting the same files
	}

	function removeItem(index: number) {
		const [item] = uploadQueue.splice(index, 1);
		if (item) URL.revokeObjectURL(item.previewImage);
		lastSummary = null;
	}

	function clearQueue() {
		for (const item of uploadQueue) URL.revokeObjectURL(item.previewImage);
		uploadQueue = [];
		results = [];
		finishedCount = 0;
		lastSummary = null;
	}

	function addTag(index: number, raw: string) {
		const tag = raw?.trim();
		if (!tag) return;
		const item = uploadQueue[index];
		if (!item || item.tags.includes(tag)) return;
		item.tags.push(tag);
	}

	function removeTag(index: number, tag: string) {
		const item = uploadQueue[index];
		if (item) item.tags = item.tags.filter((t) => t !== tag);
	}

	async function makeRequest(item: UploadItem): Promise<any> {
		const formData = new FormData();
		formData.append('image', item.file);
		const response = await fetch('/upload', { method: 'POST', body: formData });
		const envelope = await response.json().catch(() => null);
		if (!response.ok || !envelope || envelope.type !== 'success') {
			throw new Error(envelope?.error?.message || `Upload failed (${response.status})`);
		}
		// SvelteKit encodes action results with devalue in JSON action responses.
		// The framework decodes this automatically for form actions, so a manual
		// fetch must decode it here to recover the plain result object.
		return envelope.data != null ? devalueParse(envelope.data) : null;
	}

	async function worker(start: number) {
		const total = uploadQueue.length;
		for (let i = start; i < total; i += CONCURRENCY) {
			try {
				const value = await makeRequest(uploadQueue[i]);
				results[i] = { status: 'fulfilled', value };
			} catch (reason) {
				results[i] = { status: 'rejected', reason };
			}
			finishedCount = Math.min(total, finishedCount + 1);
		}
	}

	async function uploadAll() {
		if (isUploading || uploadQueue.length === 0) return;
		isUploading = true;
		lastSummary = null;
		results = uploadQueue.map(() => undefined);
		finishedCount = 0;

		const total = uploadQueue.length;
		const runners: Promise<void>[] = [];
		for (let i = 0; i < Math.min(CONCURRENCY, total); i++) runners.push(worker(i));
		await Promise.all(runners);

		let successes = 0,
			duplicates = 0,
			failures = 0;
		for (const r of results) {
			if (!r || r.status === 'rejected') {
				failures++;
				continue;
			}
			const v = r.value;
			if (v?.success === false) {
				failures++;
				continue;
			}
			if ((v?.submitted ?? 0) > 0) successes += v.submitted;
			if ((v?.duplicates ?? 0) > 0) duplicates += v.duplicates;
		}
		lastSummary = { successes, duplicates, failures };
		isUploading = false;
	}

	function itemStatus(index: number): ItemStatus {
		const r = results[index];
		if (r) {
			if (r.status === 'rejected' || r.value?.success === false) return 'error';
			if ((r.value?.submitted ?? 0) === 0 && (r.value?.duplicates ?? 0) > 0) return 'duplicate';
			return 'done';
		}
		if (isUploading && finishedCount > index) return 'uploading';
		return 'pending';
	}

	const progressPct = $derived(
		uploadQueue.length ? Math.round((finishedCount / uploadQueue.length) * 100) : 0
	);
</script>

<div class="uploadPage">
	<h2 class="pageTitle">Upload</h2>

	<!-- Drop zone -->
	<div
		class="dropzone"
		class:dragover={isDragOver}
		role="button"
		tabindex="0"
		aria-label="Drop images here or click to browse"
		onclick={() => fileInput?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
		}}
		ondragover={(e) => {
			e.preventDefault();
			isDragOver = true;
		}}
		ondragleave={() => {
			isDragOver = false;
		}}
		ondrop={(e) => {
			e.preventDefault();
			isDragOver = false;
			if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
		}}
	>
		<input
			bind:this={fileInput}
			type="file"
			multiple
			hidden
			accept="image/*,video/mp4,video/webm"
			onchange={handleInputChange}
		/>
		<svg class="dropIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke-linecap="round" />
		</svg>
		<p class="dropText">
			{#if isDragOver}Drop files to add them{:else}Drop images here, or <span class="browseLink"
					>browse</span
				>{/if}
		</p>
		<p class="dropHint">JPG, PNG, WEBP, GIF, MP4, WEBM &mdash; up to 50MB each</p>
	</div>

	<!-- Queue header -->
	{#if uploadQueue.length > 0}
		<div class="queueHeader">
			<span class="queueCount"
				>{uploadQueue.length} file{uploadQueue.length === 1 ? '' : 's'} queued</span
			>
			<div class="queueActions">
				<button class="clearBtn" onclick={clearQueue} disabled={isUploading}>Clear all</button>
				<button class="uploadBtn" onclick={uploadAll} disabled={isUploading}>
					{#if isUploading}Uploading&hellip;{:else}Upload all{/if}
				</button>
			</div>
		</div>

		{#if isUploading}
			<div
				class="progress"
				role="progressbar"
				aria-valuenow={progressPct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div class="progressFill" style="width: {progressPct}%"></div>
			</div>
		{/if}

		<!-- Summary (replaces alert) -->
		{#if lastSummary}
			<div class="summary" class:hasErrors={lastSummary.failures > 0}>
				<span class="summaryChip ok">{lastSummary.successes} uploaded</span>
				{#if lastSummary.duplicates > 0}<span class="summaryChip dup"
						>{lastSummary.duplicates} duplicate{lastSummary.duplicates === 1 ? '' : 's'} skipped</span
					>{/if}
				{#if lastSummary.failures > 0}<span class="summaryChip err"
						>{lastSummary.failures} failed</span
					>{/if}
			</div>
		{/if}

		<!-- Queue cards -->
		<div class="queueList">
			{#each uploadQueue as item, index (item.previewImage)}
				{@const status = itemStatus(index)}
				<div
					class="uploadContainer"
					class:card-done={status === 'done'}
					class:card-error={status === 'error'}
				>
					<div class="previewWrap">
						<img src={item.previewImage} alt={item.name} class="upload-preview" loading="lazy" />
						<span class="statusChip st-{status}">
							{status === 'done'
								? '✓ uploaded'
								: status === 'error'
									? '✕ failed'
									: status === 'duplicate'
										? 'duplicate'
										: status === 'uploading'
											? 'uploading…'
											: 'queued'}
						</span>
					</div>
					<div class="itemDetails">
						<div class="itemTitleRow">
							<span class="itemName" title={item.name}>{item.name}</span>
							<span class="itemSize">{item.size}</span>
						</div>
						<label class="upload-label" for="name-{index}">Name:</label>
						<input
							type="text"
							id="name-{index}"
							class="upload-input"
							value={item.name}
							disabled={isUploading}
							oninput={(e) => {
								item.name = e.currentTarget.value;
							}}
						/>
						<span class="upload-label">Tags:</span>
						<div id="tagBox-{index}" class="upload-tagBox">
							{#each item.tags as tag (tag)}
								<Tag {tag} edit={true} onDelete={(t: string) => removeTag(index, t)} />
							{/each}
							<div class="tagInput">
								<AutoTagInput
									autocompleteTags={[]}
									on:tag={(e) => addTag(index, (e as CustomEvent<{ tag: string }>).detail.tag)}
								/>
							</div>
						</div>
					</div>
					<button
						class="removeBtn"
						title="Remove from queue"
						onclick={() => removeItem(index)}
						disabled={isUploading}
					>
						<svg
							viewBox="0 0 24 24"
							width="18"
							height="18"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="emptyHint">No files selected yet. Add some to build your upload queue.</p>
	{/if}
</div>

<style>
	.uploadPage {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 10px 0 40px;
		font-family: 'Montserrat', sans-serif;
		color: var(--text-primary);
	}

	.pageTitle {
		margin: 0;
		font-size: 1.6rem;
		color: var(--text-accent);
	}

	/* ---- Drop zone ---- */
	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 180px;
		padding: 24px;
		border: 2px dashed var(--border-color);
		border-radius: 12px;
		background-color: var(--bg-secondary);
		cursor: pointer;
		text-align: center;
		transition:
			border-color 0.2s,
			background-color 0.2s,
			transform 0.1s;
	}

	.dropzone:hover,
	.dropzone:focus-visible {
		border-color: var(--text-accent);
		outline: none;
	}

	.dropzone.dragover {
		border-color: var(--bg-accent);
		background-color: color-mix(in srgb, var(--bg-accent) 15%, var(--bg-secondary));
		transform: scale(1.005);
	}

	.dropIcon {
		width: 44px;
		height: 44px;
		color: var(--text-secondary);
	}

	.dropText {
		margin: 0;
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.browseLink {
		color: var(--text-accent);
		text-decoration: underline;
		font-weight: 600;
	}

	.dropHint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	/* ---- Queue header ---- */
	.queueHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
	}

	.queueCount {
		font-size: 1rem;
		font-weight: 600;
	}

	.queueActions {
		display: flex;
		gap: 10px;
	}

	.clearBtn {
		padding: 9px 16px;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-family: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	.clearBtn:hover:not(:disabled) {
		color: var(--text-primary);
		border-color: var(--text-secondary);
	}

	.uploadBtn {
		padding: 9px 22px;
		border-radius: 8px;
		border: none;
		background-color: var(--button-primary);
		color: #fff;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.uploadBtn:hover:not(:disabled) {
		opacity: 0.88;
	}

	.uploadBtn:disabled,
	.clearBtn:disabled,
	.removeBtn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ---- Progress ---- */
	.progress {
		height: 8px;
		border-radius: 4px;
		background-color: var(--border-color);
		overflow: hidden;
	}

	.progressFill {
		height: 100%;
		border-radius: 4px;
		background-color: var(--bg-accent);
		transition: width 0.25s ease;
	}

	/* ---- Summary ---- */
	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 10px;
		background-color: color-mix(in srgb, var(--bg-accent) 12%, var(--bg-secondary));
		border: 1px solid var(--border-color);
	}

	.summary.hasErrors {
		background-color: color-mix(in srgb, #dc3545 10%, var(--bg-secondary));
	}

	.summaryChip {
		font-size: 0.85rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 20px;
	}

	.summaryChip.ok {
		background-color: #d4edda;
		color: #155724;
	}

	.summaryChip.dup {
		background-color: #fff3cd;
		color: #856404;
	}

	.summaryChip.err {
		background-color: #f8d7da;
		color: #721c24;
	}

	/* ---- Queue list ---- */
	.queueList {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.uploadContainer {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
		border-radius: 12px;
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
		transition: opacity 0.2s;
	}

	.uploadContainer.card-done {
		opacity: 0.75;
	}

	.uploadContainer.card-error {
		border-color: #dc3545;
	}

	.previewWrap {
		position: relative;
		flex-shrink: 0;
	}

	.upload-preview {
		display: block;
		width: 100%;
		max-width: 220px;
		height: 160px;
		object-fit: cover;
		border-radius: 8px;
		background-color: var(--bg-secondary);
	}

	.statusChip {
		position: absolute;
		top: 8px;
		left: 8px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 20px;
		backdrop-filter: blur(4px);
	}

	.st-pending {
		background-color: rgba(108, 117, 125, 0.85);
		color: #fff;
	}

	.st-uploading {
		background-color: rgba(0, 123, 255, 0.85);
		color: #fff;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.st-done {
		background-color: rgba(40, 167, 69, 0.9);
		color: #fff;
	}

	.st-duplicate {
		background-color: rgba(255, 193, 7, 0.9);
		color: #5c4a00;
	}

	.st-error {
		background-color: rgba(220, 53, 69, 0.9);
		color: #fff;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.itemDetails {
		flex-grow: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.itemTitleRow {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 4px;
	}

	.itemName {
		font-weight: 600;
		font-size: 1rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.itemSize {
		font-size: 0.8rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.upload-label {
		margin: 10px 0 5px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.upload-input {
		width: 100%;
		padding: 9px 12px;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.95rem;
		background-color: var(--bg-input);
		color: var(--text-primary);
		transition: border-color 0.2s;
	}

	.upload-input:focus {
		border-color: var(--text-accent);
		outline: none;
	}

	.upload-tagBox {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		padding: 8px;
		min-height: 44px;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background-color: var(--bg-secondary);
	}

	.tagInput {
		flex-grow: 1;
		min-width: 140px;
	}

	.removeBtn {
		align-self: flex-start;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.removeBtn:hover:not(:disabled) {
		background-color: color-mix(in srgb, #dc3545 15%, transparent);
		color: #dc3545;
	}

	.emptyHint {
		color: var(--text-secondary);
		font-size: 0.95rem;
		text-align: center;
		padding: 20px;
	}

	@media (min-width: 768px) {
		.uploadContainer {
			flex-direction: row;
			align-items: flex-start;
		}

		.previewWrap {
			width: 220px;
		}
	}
</style>
