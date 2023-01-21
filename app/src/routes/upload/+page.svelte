<script>
import { browser } from "$app/environment";


</script>

<h1>b..d</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<div class = midContainer>
    <form method="POST" enctype="multipart/form-data">
        <label for="image">Upload Image </label>
            <input name="image" id = "image" type="file" multiple required>
        
        <button type="submit">Submit</button>
        </form>
</div>

<style>
    .midContainer{
        display:flex;
    }
</style>