<script>
import { browser } from "$app/environment";


</script>

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