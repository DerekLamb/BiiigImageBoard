import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import { groupController } from '$lib/server/controllers/groupController';
import type { PageServerLoad } from './$types';


/** @type {import('./$types').PageServerLoad} */

export const load = (async ({ url, request}) => {
    const session = await auth.api.getSession(
        { headers: request.headers } 
    );

    if (!session) {
        redirect(307, '/login');
    }


    const { searchParams } = url;
    const pageNum : number = parseInt(searchParams.get('page') as string) || 1;
    const searchTerm : string = searchParams.get('search') as string || '';
    const currPage = Math.max(pageNum, 1);

    let lengthNum = parseInt(searchParams.get('len') as string);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 100) {
        lengthNum = 24; 
    }
    
    const groups = await groupController.getGroupPage({page: currPage, length: lengthNum, search: searchTerm})
    
    const pageLength = lengthNum || 24;

    const numPages = Math.ceil(await groupController.getGroupCount() / pageLength);

    return{
        status: 200,
        groups: groups,
        pageNum: numPages,
        currPage: currPage,
        len: lengthNum,
        searchTerm: searchTerm
    }
    
}) satisfies PageServerLoad;

