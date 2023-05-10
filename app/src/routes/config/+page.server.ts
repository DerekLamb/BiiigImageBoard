import { embPromptGrab } from "$lib/processFiles";
import db from "$lib/db";
import { trusted } from "svelte/internal";

/** @type {import('./$types').Actions} */

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