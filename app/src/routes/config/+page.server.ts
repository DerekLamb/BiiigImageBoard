import { embPromptGrab } from "$lib/processFiles";
import { trusted } from "svelte/internal";
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').Actions} */


export const load = async (event) => {
    if(!event.locals.user){
        redirect(307, '/login');
    }
    if(event.locals.user.username !== "admin"){
        // handle here if no admin TODO
    }
    return{
        username: event.locals.user.username
    }
}

export const actions = {

  default: async ({ request }) => {
    try {
        const body = request.body;
        console.log("stuff");
        embPromptGrab('images');
    } 
    catch (error) {
        console.error(error);
        return {
            status: 500,
            headers: {
                'content-type': 'application/json'
                },
            error: 'Internal server error'
        }
    }
  
  
    return {
        status: 200,
        headers: {'content-type': 'application/json'},
        body: { message: "Images Checked!" }
    };
    }
}