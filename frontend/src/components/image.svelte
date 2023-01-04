
<script>
    export const size = "default";
    let imageSource = "";
	export let src = "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459__340.png";
	let height;
	let width = "250px";
    let upScore = "100"
    let downScore = "20"
    // margin calculated based on viewport width
</script>


<a href={src}><img {src} alt = "Test" style = "width:{width}"></a>


<style>
    img{

        min-width: 200px;
        min-height: 100px;
        background-color: aquamarine;
        margin: 20px;
    }
</style>