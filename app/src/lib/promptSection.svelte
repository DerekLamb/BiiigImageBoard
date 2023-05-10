<script>
    export let items = [];
    
    function copyItems() {
      const copyText = items.join(",");
      navigator.clipboard.writeText(copyText);
    }
  </script>
  
  <style>
    ul {
      list-style: none;
      margin: 0;
    }
  
    li {
      margin-bottom: 5px;
    }
  </style>
  
  <button on:click={copyItems}>Copy Items</button>
  
  <ul>
    {#each items as item}
      <li>{item}</li>
    {/each}
  </ul>