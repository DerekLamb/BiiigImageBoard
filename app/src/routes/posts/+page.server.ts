import { page } from '$app/stores';
import db from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ( url ) => {
    const searchParams = new URLSearchParams(url.search);
    const pageNum = parseInt(searchParams.get("page"));
    const currPage = (pageNum > 0) ? (pageNum) : 1;
    const lengthNum = parseInt(searchParams.get("len"));
    console.log(pageNum);
    const pageLength = (searchParams.get("len"))?(lengthNum * 1):30;
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