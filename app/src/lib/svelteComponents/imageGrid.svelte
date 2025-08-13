<script lang="ts">
import Image from "$lib/image.svelte";
import { holdClick } from "$lib/actions/holdClick";

interface ImageObject {
    uploadDate:string,
    ImagePath:string,
    thumbnailPath?: string,
}

export const images: Array<ImageObject>;

toggleSelectMode()
</script>


<div class = "imageGrid" style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)" use:holdClick={{onHold: () => toggleSelectMode(), onCli}}>
    {#if images}
        {#each images as image}
            {#if image.thumbnailPath}
                <div class = "imageBox"  >
                    <Image src = "/{image.thumbnailPath}" 
                    mainLink = "/posts/{image.uploadDate}"                  
                    thumbnail={true}></Image>
                    </div>
            {:else}
                <div class = "imageBox">
                    <Image src = "/{image.imagePath}" mainLink = "/posts/{image.uploadDate}" ></Image>
                </div>
            {/if}
        {/each}
    {/if}
</div>