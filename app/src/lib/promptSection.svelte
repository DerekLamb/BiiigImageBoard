<script>
    import Tag from "./tag.svelte";
    export let items = [];
    
    function copyItems() {
      const copyText = items.join(",");
      navigator.clipboard.writeText(copyText);
      console.log("attempted to copy " + copyText);
    }
</script>

<div class="PromptSection">
  <h3>Prompt</h3>
    <div class="promptContainer">
      <ul>
          {#each items as item }
              <Tag tag = {item} ></Tag>
          {/each}
      </ul>
    </div>
    <button on:click={copyItems}>Copy Prompt</button>
  </div>

  <style>
  .PromptSection{
          display: grid;
          grid-template-rows: 2rem 2fr 1.5rem 1.5rem 1.5rem 1fr;
          background-color: #d6f8ef;
          border-radius: 15px;
      }

    .PromptSection h3{
        font-family: 'Montserrat', sans-serif;
        margin:.2rem;
        text-align:center;
    }

    ul{
        box-sizing: border-box; 
        display:flex;
        flex-direction: column;
        align-items: stretch;
        padding: 0px;
        margin: 2px;
    }
</style>


  
