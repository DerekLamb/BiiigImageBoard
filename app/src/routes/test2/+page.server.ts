import { createMissingThumbnails } from "$lib/processFiles";
import { trusted } from "svelte/internal";
import { fileUtilService } from "$lib/fileUtilityService.js";
import { thumbFileRepo } from "$lib/fileService.js";

/** @type {import('./$types').Actions} */

export const actions = {

  default: async ({ request }) => {
    try {
        const body = request.body;
        console.log("stuff");
        createMissingThumbnails("images", "thumb",);
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
        body: { message: "Thumbnails Generated Sucessfully!" }
    };
    }
}