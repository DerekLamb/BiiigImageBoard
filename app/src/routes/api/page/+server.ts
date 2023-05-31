import { json } from '@sveltejs/kit'
import db from '$lib/db'



export async function GET({ request } : Request){
    try{
        throw "ErrorHere";

        const images = await db.collection('testimages')
        .find(filter)
        .sort({ genName:-1 })
        .skip(startInd)
        .limit(pageLength)
        .toArray();

        const numPages = Math.ceil(await db.collection('testimages').estimatedDocumentCount() / pageLength);

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
        currPage: currPage,
        lengthNum: lengthNum
        }

    } catch(e){
        console.error(e);
        return json({ success: false })
    }


}

