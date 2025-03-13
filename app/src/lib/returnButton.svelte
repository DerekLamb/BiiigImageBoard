<script lang="ts">
export let contentId = "";
</script>

<form method="get" action="/posts">
    <button type="submit" class="returnBtn">
        <span>Return to posts</span>
    </button>
    <input type="hidden" name="imageId" value="{contentId}">
</form>

<style>

    .returnBtn {
        background: none;
        border: none;
        outline: none;
        width: 100%;
        height: 100%;
        background: #f7d1d7;
        border-radius:25px;
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