import { json } from '@sveltejs/kit'
import db from '$lib/db'

let imageDB = db.collection('testImages');
let tags = [];

export async function GET(event) {

    
    return json ({ tags: tags})
  }



export async function POST( event ){



    return json ({ success: true})
}