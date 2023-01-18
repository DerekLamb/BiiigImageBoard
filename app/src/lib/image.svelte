
<script>
    export const size = "default";
	export let src = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
    export let image = "";
    export let link = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
	// export let height;
	export let width = "250px";
    let upScore = "100"
    let downScore = "20"
    // margin calculated based on viewport width
</script>


<a href={link}><img {src} alt = "Err" style = "width:{width}"></a>


<style>
    img{

        min-width: 200px;
        min-height: 100px;
        background-color: aquamarine;
        margin: 20px;
    }
</style>