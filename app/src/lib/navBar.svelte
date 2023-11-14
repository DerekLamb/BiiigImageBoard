<script>

</script>

<ul class="navBar">
    <li><a href="/posts">Posts</a></li>
    <li><a href="/upload">Upload</a></li>
    <li><a href="/tags">Tags</a></li>
    <li><a href="/config">Config</a></li>
    <li><a href="/">Home</a></li>
</ul>
<style>

    ul{
        align-self: stretch;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        list-style-type: none;
        padding:0;
        text-decoration: none;
    }
    li{
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        margin:5px 10px ;
    }
    .navBar li a{  
        color: #678c9e;
        display:inline;
        text-decoration: none;
        margin:.5%;
    }
    a:visited{
        color: #678c9e;
    } 
    .navBar li a:hover{

        animation: blinkFade 0.5s cubic-bezier(0,1,.5,.91) forwards;
    }
    @keyframes blinkFade {
        0% {
            color: #ffffff;
        }
        100% {
            color: #B0E0E6
        }
    }

</style>