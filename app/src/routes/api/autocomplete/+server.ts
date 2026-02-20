import { json, redirect } from '@sveltejs/kit';
import { TagModel } from '$lib/server/models/tagModel.js';


/**
 * GET /api/pages - search tag term 
 */

export const GET = async ({ url, request }) => {
    try {
        // parameters 
        const autocompleteTag = url.searchParams.get('tags')

        if(autocompleteTag.length < 2){
            return json({sucess: false, message: 'Search term below limit'}, {status:200})
        }

        const autocompleteResults = await TagModel.searchByTerm(autocompleteTag)
        console.log(autocompleteResults)
        return json({
            success: true,
            autocompleteResults
            
        });
    } catch (error) {
        console.error('Error in autocorrect API:', error);
        return json({ success: false, error: 'Failed to fetch autocorrect results' }, { status: 500 });
    }
};