<script lang="ts"> 
    export let menuOpen = false;
    
    function toggleMenu() {
        menuOpen = !menuOpen;
    }
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
      .menu-container, .backdrop {
        display: none;
      }
    }
  
    .menu-container {
        position: fixed;
        display:flex;
        flex-direction: column;
        justify-content: end;
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

    .menu-container nav li {
        list-style-type: none;
        color: #678c9e;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        margin:10px 30px;
        text-decoration: none;
    }

    .menu-container nav a {
        color: #678c9e;
        text-decoration: none;
    }

    .menu-container nav a:visited{
        color: #678c9e;
    }
  
    .menu-container.open {
      left: 0; /* Slide in */
    }

</style>
