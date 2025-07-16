<script>
    import AutoTagInput from "$lib/autoTagInput.svelte";
    import Tag from "$lib/tag.svelte";

    let files = [];
    let uploadQueue = [];
    let makeRequests


    function handleFilesChange(event) {
        const newFiles = Array.from(files);
        console.log(event)
        newFiles.forEach(file => {
            console.log(file);
            uploadQueue.push({
                file: file,
                name: file.name,
                tags: [],
                size: file.size,
                previewImage: "umm fix?",
                metadata: { title: '', description: '' }
            });
        });
        uploadQueue = uploadQueue.slice();
        makeRequests = uploadQueue.map(file => () => fileRequest(file))
        
    }

    function updateMetadata(index, key, value) {
        uploadQueue[index].metadata[key] = value;
        uploadQueue = uploadQueue.slice();
    }

    const fileRequest = (file) => {
        let formData = new FormData();
        formData.append('image', file.file)
        return fetch('/upload', {
            method: 'POST',
            body: formData,
        })
    }

    let started = 0
    const results = []

    const recurse = () => {
        const i = started ++;
        const makeRequest = makeRequests.shift();
        return !makeRequest ? null : Promise.allSettled([makeRequest()])
            .then(result => {
                results[i] = result[0]
                return recurse();
            })
    };

    const limit = 16;
     
    const batchFileUpload = () => {
        Promise.all(Array.from({ length: limit}, recurse)).then(() => alert("Finished Uploading Media"))       
    }

</script>

<div>
    <input type="file" multiple bind:files on:change="{handleFilesChange}">
    <button on:click="{batchFileUpload}">Upload All</button>
    
    {#each uploadQueue as item, index}
        <div class = "uploadContainer">
            <img src="" alt="preview" class="upload-preview" style="width: 400px; height: auto;">
            <label for="title" class="upload-label">Name:</label>
            <input type="text" class="upload-input" id="title" value="{item.name}" on:input="{e => updateMetadata(index, 'title', e.target.value)}">
            <label for="tagBox">Tags:</label>
            <div id = "tagBox" class="upload-tagBox">
                    {#each item.tags as tag, tagIndex}
                        <Tag tag={tag} edit={true} />
                    {/each}
                <input type="text" id="tagAddInput" placeholder="Add tag and press Enter" on:keydown="{e => handleKeyDown(e, index)}">
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

    #tagAddInput {
        flex-grow: 1;
        min-width: 120px;
        padding: 8px 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
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