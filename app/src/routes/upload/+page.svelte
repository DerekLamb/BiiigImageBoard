<script>
// import ImageBrowser from "../../components/imageBrowser.svelte"
// import Tagbar from "../../components/tagbar.svelte";

//set tag to specific size or move based on screen size
//decide image browser size 
</script>

<h1>b..d</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<div class = midContainer>
    <div></div>
    <form method="POST" enctype="multipart/form-data">
        <label for="imageName">Name</label>
        <input id = "imageName" type="text">
        <label>
            Upload Image
            <input name="image" type="file" required>
        </label>
        <button type="submit">Submit</button>

</div>

<style>
    .midContainer{
        display:flex;
    }
</style>