interface Filter {
        $and?: { tags: {$regex: string, $options: string}}
        $nor?: {$regex: string, $options: string}
        tags?: {$all: string[]} | {$nin:string[]},
        embPrompt?: {$all:string[]} | {$nin:string[]} 
    } 
  


export default function txtToSearchParam(searchTerm : string){
    if(!searchTerm){
        return {}
    }

    let filter : Filter = {}
    let keywords = ["order:","emb*:","type:","name:","-"]

    //V2 using regex ( so much easier to build, hopefully is performant )

    const tags = searchTerm.split(" ");
    const positiveTags : string[] = [];
    const negativeTags : string[] = [];

    tags.forEach(tag => {
      if (tag.startsWith('-')) {
        negativeTags.push(tag.substring(1));
      } else {
        positiveTags.push(tag);
      }
    });

    if (positiveTags.length > 0){
      filter.$and = positiveTags.map(tag => ({ tags: { $regex: tag, $options: 'i' }}))
    }
    if (negativeTags.length > 0){
      filter.$nor = negativeTags.map(tag => ({ tags: {$regex: tag.substring(1), $options:1}}))
    }

    console.log(filter.$and);

    return filter
    
}