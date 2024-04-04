<script>
import { browser } from "$app/environment";


function toggleMenu() {
    console.log("toggleMenu");
    if (browser) {
        const menu = document.querySelector('.menu-container');
        const backdrop = document.querySelector('.backdrop');
        menu.classList.toggle('open');
        backdrop.classList.toggle('open');
    }
}
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