<script lang="ts">
    export let src = '';
    export let alt = "Err";
    export let name = "";
    export let mainLink = "";

</script>

<div class="groupCont">
    <a href = {mainLink}>
        <img class="thmb" src={src} alt={alt}/>
    </a>
    <span class = "name ">{name}</span>
    
</div>

<style>

    .groupCont {
        width: 100%; 
        padding: 3px;
        box-sizing: border-box;
        display:flex;
        flex-direction: column;
        border-radius: 5px;
        color: #345D7E;
    }

    .groupCont img {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 4px;
    }

    .groupCont span {
        display: block; 
        overflow: hidden; 
        white-space: nowrap; 
        text-overflow: ellipsis; 
        font-size: 1em; 
        margin-top: 8px; 
    }

</style>