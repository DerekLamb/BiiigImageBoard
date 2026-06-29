<script lang="ts">
    import AutoTagInput from "$lib/autoTagInput.svelte";
    import Tag from "$lib/tag.svelte";

    interface UploadItem {
        file: File;
        name: string;
        tags: string[];
        size: number;
        previewImage: string;
        metadata: { title: string; description: string };
    }

    interface UploadResult {
        status: 'fulfilled' | 'rejected';
        value?: any;
        reason?: unknown;
    }

    interface MakeRequestFn {
        (): Promise<Response>;
    }

    let files: FileList = {} as FileList;
    let uploadQueue: UploadItem[] = [];
    let uploadStatus = {
        started: 0,
        results: [] as UploadResult[],
        makeRequests: [] as MakeRequestFn[]
    };

    function handleFilesChange(event: Event) {
        const target = event.target as HTMLInputElement;
        files = target.files as FileList;

        uploadStatus = {
            started: 0,
            results: [],
            makeRequests: []
        };

        const newFiles = Array.from(files);
        console.log(event);
        newFiles.forEach(file => {
            console.log(file);
            uploadQueue.push({
                file: file,
                name: file.name,
                tags: [],
                size: file.size,
                previewImage: URL.createObjectURL(file),
                metadata: { title: '', description: '' }
            });
        });
    }

    function updateMetadata(index: number, key: 'title' | 'description', e: Event & { currentTarget: HTMLInputElement}) {
        if(e.currentTarget.value) uploadQueue[index].metadata[key] = e.currentTarget.value 
    }

    const fileRequest = (file: UploadItem) => {
        let formData = new FormData();
        formData.append('image', file.file)
        return fetch('/upload', {
            method: 'POST',
            body: formData,
        })
    }

    const processBatch = async () => {
        const i = uploadStatus.started++;
        if (!uploadStatus.makeRequests[i]) return null;

        try {
            const response = await uploadStatus.makeRequests[i]();
            const result = await response.json();
            uploadStatus.results[i] = { status: 'fulfilled', value: result };
        } catch (reason) {
            uploadStatus.results[i] = { status: 'rejected', reason };
        }
        return processBatch();
    };

    const batchFileUpload = async () => {
        uploadStatus = {
            started: 0,
            results: [],
            makeRequests: uploadQueue.map(item => () => fileRequest(item))
        };

        const limit = Math.min(16, uploadQueue.length);
        const runners: Promise<any>[] = [];
        for (let i = 0; i < limit; i++) {
            runners.push(processBatch());
        }
        await Promise.all(runners);

        const successes = uploadStatus.results
            .filter(r => r?.status === 'fulfilled' && r.value?.success === true)
            .reduce((sum, r) => sum + (r.value.submitted || 0), 0);
        const duplicates = uploadStatus.results
            .filter(r => r?.status === 'fulfilled' && r.value?.duplicates !== undefined)
            .reduce((sum, r) => sum + (r.value.duplicates || 0), 0);
        const failures = uploadStatus.results
            .filter(r => r?.status === 'rejected' || (r?.status === 'fulfilled' && r.value?.success === false))
            .length;

        let message = `Successfully uploaded: ${successes}`;
        if (duplicates > 0) message += `\nDuplicates skipped: ${duplicates}`;
        if (failures > 0) message += `\nFailed: ${failures}`;
        
        alert(message);
        uploadQueue = [];
    };

</script>

<div>
    <input type="file" multiple bind:files onchange="{handleFilesChange}">
    <button onclick="{batchFileUpload}">Upload All</button>
    
    {#each uploadQueue as item, index}
        <div class = "uploadContainer">
            <img src="" alt="preview" class="upload-preview" style="width: 400px; height: auto;">
            <label for="title" class="upload-label">Name:</label>
            <input type="text" class="upload-input" id="title" value="{item.name}" oninput="{e => updateMetadata(index, 'title', e)}">
            <label for="tagBox">Tags:</label>
            <div id = "tagBox" class="upload-tagBox">
                    {#each item.tags as tag, tagIndex}
                        <Tag tag={tag} edit={true} onDelete={tag}/>
                    {/each}
                <AutoTagInput autocompleteTags={["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9"]} />
            </div>
        </div>
    {/each}
</div>


<style>
    .uploadContainer {
        background-color: #f8f8fa;
        display: flex;
        flex-direction: column;
        margin: 15px 0;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        border: 1px solid #e8e8ec;
    }

    .upload-preview {
        width: 100%;
        max-width: 400px;
        height: 250px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 15px;
        align-self: center;
    }

    .upload-label {
        display: block;
        margin: 12px 0 6px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #444;
    }

    .upload-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .upload-input:focus {
        border-color: #4a90e2;
        box-shadow: 0 0 0 2px rgba(74,144,226,0.25);
        outline: none;
    }

    .upload-tagBox {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        background-color: white;
        border-radius: 8px;
    }

    @media (min-width: 768px) {
        .uploadContainer {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-start;
        }
        
        .upload-preview {
            margin-right: 25px;
            margin-bottom: 0;
        }
    }

</style>