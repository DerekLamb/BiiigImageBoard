<script>
	import Image from "$lib/image.svelte";
    import AutoTagInput from "$lib/autoTagInput.svelte";
    import Tag from "$lib/tag.svelte";

    let files = [];
    let uploadQueue = [];

    function handleFilesChange() {
        const newFiles = Array.from(files);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadQueue.push({
                    file: file,
                    name: file.name,
                    tags: [],
                    size: file.size,
                    previewImage: e.target.result,
                    metadata: { title: '', description: '' }
                });
                uploadQueue = uploadQueue.slice();
            };
            reader.readAsDataURL(file);
        });
    }

    function updateMetadata(index, key, value) {
        uploadQueue[index].metadata[key] = value;
        uploadQueue = uploadQueue.slice();
    }

    async function submitBatch() {
        while (uploadQueue.length > 0) {
            let batch = uploadQueue.splice(0, 20);
            // Convert batch data to form or JSON as required by your backend
            // Use fetch or Axios to POST data
            console.log('Submitting:', batch);  // Placeholder for actual submission
        }
    }

    function handleKeyDown(event, index) {
        if (event.key === "Enter") {
            const newTag = event.target.value.trim().replaceAll(" ", "_");
            if (newTag !== "") {
                uploadQueue[index].tags.push(newTag);
                uploadQueue = uploadQueue.slice();
                event.target.value = "";  // Clear the input after adding the tag
            }
        }
    }
</script>

<div>
    <input type="file" multiple bind:files on:change="{handleFilesChange}">
    <button on:click="{submitBatch}">Upload All</button>
    
    {#each uploadQueue as item, index}
        <div class = "uploadContainer">
            <img src="{item.previewImage}" alt="preview" style="width: 400px; height: auto;">
            <label for="title">Title:</label>
            <input type="text" id="title" value="{item.name}" on:input="{e => updateMetadata(index, 'title', e.target.value)}">
            <label for="tagBox">Tags:</label>
            <div id = "tagBox" class="whiteBox">
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
        display: flex;
        align-items:flex-end;
        margin: 10px;
    }

    .whiteBox {
        max-width: 700px;
        display:flex;
        flex-wrap:wrap;
        align-items: flex-start;
        background-color: white;
        border-radius: 5px;
        padding: 5px;
        margin: 5px;
    }

    #tagAddInput {
        width: 100%;
        padding: 5px;
        border: none;

    }
</style>