<script>
    import { menuOpen } from "$lib/stores/searchStore";

  
    function toggleMenu() {
      menuOpen.update((state) => !state);
    }
</script>
  
<!-- Regular Navbar -->
<div class="navContainer">
    <!-- Brand or Logo -->
    <!-- <div class="brand">
    b.d
    </div> -->

    <!-- Menu Items for Desktop -->
    <div class="navbar">
        <a href="/posts">Posts</a>
        <a href="/tags">Tags</a>
        <a href="/upload">Upload</a>
        <a href="/home">Home</a>
        <a href="/login">Login</a>
    </div>

    <!-- Menu Button for Mobile -->
    <button class="menu-button" class:open={$menuOpen} on:click={toggleMenu}>Menu</button>
</div>

<!-- Off-Canvas Menu for Mobile -->
<div class="menu-container" class:open={$menuOpen}>
    <!-- Mobile Menu Content -->
    <nav>
        <ul>
            <li><a href="/posts">Posts</a></li>
            <li><a href="/tags">Tags</a></li>
            <li><a href="/upload">Upload</a></li>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
        </ul>
    </nav>
</div>  
  
  <style>
    .navContainer {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
    }

    .navbar {
        display:flex;
        align-self: stretch;
    }

    .navbar a {
        color: #678c9e;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        margin:5px 10px ;
        text-decoration: none;
        display:inline;
    }

    .navbar a:visited{
        color: #678c9e;
    }

    .navbar a:hover{
        animation: blinkFade 0.5s cubic-bezier(0,1,.5,.91) forwards;
    }

    @keyframes blinkFade {
        0% {
            color: #ffffff;
        }
        100% {
            color: #8dd4b8
        }
    }

    .menu-button {
      display: block;
      position: fixed;
      left: 50%; /* Center button */
      bottom: 20px; /* Place near the middle bottom for thumb access */
      transform: translateX(-50%); /* Adjust for actual button width */
      z-index: 1000; /* Above content */
    }

    .menu-button.open {
        left:90%;
    }
  
    .menu-container {
      position: fixed;
      display:flex;
      flex-direction: column;
      justify-content: end;
      top: 0;
      bottom: 0;
      left: -200px; /* Menu width */
      width: 200px;
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
  
    .backdrop {
      display: none;
      /* ...rest of the backdrop styles */
    }
  
    .backdrop.open {
      display: block;
    }
  
    @media (min-width: 600px) {
      .navbar {
        display: flex;
      }
  
      .menu-button {
        display: none;
      }
  
      .menu-container,
      .backdrop {
        display: none;
      }
    }
  
    @media (max-width: 599px) {
      .menu-button {
        display: block;
      }
      .navbar {
        display: none;
      }

    }
  </style>