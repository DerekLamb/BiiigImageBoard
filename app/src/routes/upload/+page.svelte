<script>
    import { writable } from 'svelte/store';

    let files = [];

    function onChange(event) {
        const arrFiles = Array.from(event.target.files).map(file => {
            if (file.type.startsWith('image')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    file.previewImage = e.target.result;
                    files = files.map(f => f === file ? { ...f, previewImage: e.target.result } : f);
                };
                reader.readAsDataURL(file);
            }
            return file;
        });
        files = arrFiles; 
        console.log(files);
    }
</script>

<div class="midContainer">
    <form method="POST" enctype="multipart/form-data">
        <label for="image">Upload Image:</label>
        <input type="file" id="image" name="image" on:change={onChange} multiple required>
        <button type="submit">Submit</button>
    </form>
    
    {#if files && files.length > 0}
        <h2>Uploaded Files:</h2>
        {#each files as file}
            <p>{file.name} ({file.size} bytes)</p>
            {#if file.previewImage}
                <img src={file.previewImage} alt={file.name} style="max-width: 200px; max-height: 200px;">
            {/if}
        {/each}
    {/if}
</div>

<style>
    .midContainer {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>