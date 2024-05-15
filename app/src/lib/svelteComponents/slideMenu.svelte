<script lang="ts"> 
    export let menuOpen = false;
</script>

<div class="menu-container" class:open={menuOpen} role="menu" tabindex=0> 
    <nav>
        <ul>
            <slot />
        </ul>
    </nav>
</div>  

<style>
    
    @media (min-width: 600px) {
      .menu-container {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
        .menu-container {
            display:flex;
            flex-direction: column;
            justify-content: end;
        }
    }
  
    .menu-container {
        position: fixed;
        top: 0;
        bottom: 0;
        left: -200px; /* Menu width */
        width: 200px; /* Menu width */
        background-color: #fff;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
        transition: left 0.3s;
        z-index: 1000;
    }

    .menu-container nav {
        display:flex;
        flex-direction: column;
        justify-content: end;
        align-items: flex-end;
        margin: 0;
        padding: 0;
    }
  
    .menu-container.open {
      left: 0; /* Slide in */
    }

</style>
