import db from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ( url ) => {
    const searchParams = url.url.searchParams
    const currPage = ((searchParams.get("page") * 1) >= 1)?(searchParams.get("page")):1;
    const pageLength = (searchParams.get("len"))?(searchParams.get("len") * 1):30;
    const startInd = (currPage - 1) * pageLength;

    const images = await db.collection('testimages').find().sort({ genName:-1 }).skip(startInd).limit(pageLength).toArray();
    const numPages = Math.ceil(await db.collection('testimages').countDocuments() / pageLength);
    const rawImages = images.map(({ name, fsName, genName, imagePath, tags}) => ({
        name,
        fsName,
        genName,
        imagePath,
        tags
    }))


    return{
        status: 200,
        images: rawImages,
        pageNum: numPages,
        currPage: currPage
    }
}