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
        background: #f7d1d7;
        border-radius:25px;
        transition: background-color 0.2s;
    }

    .returnBtn:hover {
    background-color: #ffffff;
  }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #5b5b5b;
        width: 100%;
        text-align: center;
    }

</style>