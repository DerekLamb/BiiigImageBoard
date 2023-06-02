interface Filter {
        tags?: {$all: string[]} | {$nin:string[]},
        embPrompt?: {$all:string[]} | {$nin:string[]} 
    } 
  


export default function txtToSearchParam(searchTerm : string){
    if(!searchTerm){
        return {}
    }
    let filter : Filter = {}
    let keywords = ["order:","emb*:","type:","name:","-"]
    let splitTerms = searchTerm.split("emb:")
    if(splitTerms[1]){
        let splitEmbTerms = splitTerms[1].split(" ");
        let posEmbTerms = splitEmbTerms.filter(term => !term.startsWith("-"));
        let negEmbTerms = splitEmbTerms.filter(term => term.startsWith("-")).map(term => term.slice(1));
        filter.embPrompt = {
            $all: posEmbTerms,
            $nin: negEmbTerms
        }
    }
    let splitTagTerms = splitTerms[0].split(" ");
    let posTagTerms = splitTagTerms.filter(term => !term.startsWith("-"));
    let negTagTerms = splitTagTerms.filter(term => term.startsWith("-")).map(term => term.slice(1));
   

    if(!splitTerms[1]){
        filter.tags = {     
            $all: posTagTerms,
            $nin: negTagTerms
        }
    }
    console.log(filter);

    return filter
    
}

//TODO Improve this function to handle wildcards

function buildMongoQuery(posTagTerms: string[], negTagTerms: string[], searchTerm: string): object {
    let query: any = {};
    let andArray: any[] = [];
    let orArray: any[] = [];
  
    // Build query for positive tag terms
    posTagTerms.forEach(term => {
      if (term.includes("*")) {
        let regexTerm = term.replace(/[*]/gi, ".*");
        let regex = new RegExp(regexTerm, "i");
        orArray.push({tags: {$regex: regex}});
      } else {
        andArray.push({tags: term});
      }
    });
  
    // Build query for negative tag terms
    negTagTerms.forEach(term => {
      if (term.includes("*")) {
        let regexTerm = term.replace(/[*]/gi, ".*");
        let regex = new RegExp(regexTerm, "i");
        andArray.push({tags: {$not: {$regex: regex}}});
      } else {
        andArray.push({tags: {$not: term}});
      }
    });
  
    // Build query for search term
    if (searchTerm) {
      if (searchTerm.includes("*")) {
        let regexTerm = searchTerm.replace(/[*]/gi, ".*");
        let regex = new RegExp(regexTerm, "i");
        orArray.push({$or: [{name: {$regex: regex}}, {type: {$regex: regex}}]});
      } else {
        andArray.push({$or: [{name: searchTerm}, {type: searchTerm}]});
      }
    }
  
    // Combine query arrays
    if (andArray.length > 0) {
      query.$and = andArray;
    }
  
    if (orArray.length > 0) {
      query.$or = orArray;
    }
  
    return query;
  }
  