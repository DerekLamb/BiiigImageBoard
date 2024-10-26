import { json } from '@sveltejs/kit'
import { db } from '$lib/db.server'



export async function GET({ request } : Request){
    try{
        interface Filter {
            tags?: { $all: string[]} | { $not: {$in: string[] } };
          }
    
            // Create a filter object to pass to the MongoDB 'find' method
            let filter:Filter = {};
            if (tags.length > 0) {
                filter.tags = { $all: tags };
            }
            if (notag) {
                filter.tags = { $not: { $in: [notag] } };
            }

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

