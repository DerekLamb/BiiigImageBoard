<script lang="ts">
import { goto } from "$app/navigation";

export let contentId = "";

function returnToPosts(){
    goto(`/posts?imageId=${contentId}`)
}

</script>
    <button type="submit" class="returnBtn" on:click={returnToPosts}>
        <span>Return to posts</span>
    </button>
    <input type="hidden" name="contentId" value="{contentId}">

<style>

    .returnBtn {
        border: none;
        outline: none;
        width: 100%;
        height: 50px;
        background: var(--bg-input);
        border-radius:25px;
        transition: background-color 0.3s ease;
    }

    .returnBtn:hover {
        background-color: var(--button-hover);
    }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: var(--text-muted);
        width: 100%;
        text-align: center;
    }

</style>