<script>
    export let link = "https://www.google.com"
    export let name = "test"

</script>


<li><a href={link}>{name}</a></li>

<style>
    li{
        font-family: 'Montserrat', sans-serif;
        list-style: none;

    }
    a{
        color: #7b959c;
        text-decoration: none;
    }
    a:hover{
        color: #5e725e;
        transition: .5s;
    }
</style>