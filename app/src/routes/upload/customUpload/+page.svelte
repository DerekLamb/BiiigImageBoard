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
                console.log(result)
                results[i] = result[0]
                return recurse();
            })
    };

    const limit = 8
     
    const batchFileUpload = () => {
        Promise.all(Array.from({ length: limit}, recurse))        
    }

</script>

<div>
    <input type="file" multiple bind:files on:change="{handleFilesChange}">
    <button on:click="{batchFileUpload}">Upload All</button>
    
    {#each uploadQueue as item, index}
        <div class = "uploadContainer">
            <img src="" alt="preview" style="width: 400px; height: auto;">
            <label for="title">Title:</label>
            <input type="text" id="title" value="{item.name}" on:input="{e => updateMetadata(index, 'title', e.target.value)}">
            <label for="tagBox">Tags:</label>
            <div id = "tagBox" class="textBox">
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
        background-color: #f8d8dd;
        display: flex;
        align-items:flex-end;
        margin: 10px;
        border-radius: 10px;
    }

    .textBox {
        max-width: 700px;
        display:flex;
        flex-wrap:wrap;
        align-items: flex-start;
        background-color: white;
        border-radius: 10px;
        padding: 20px;
        margin: 5px;
    }

    #tagAddInput {
        width: 100%;
        padding: 5px;
        border: none;

    }
</style>