export default function promptDecode(data:Buffer) {
    let prompt = '';
    let promptParts = [];
    let posPrompt:string[] = [];
    let negPrompt:string[] = [];
    let metaPrompt:string[] = [];
    let parsedPrompt = [];
    let name = '';
    let foundPrompt = false;
    const limit = Math.min(data.length, 2048);
    const startIndex = promptIndex(data);
    console.log(startIndex);

    if (startIndex){
        for( let i = startIndex; i < limit; i +=1){
            const currentByte = data[i];

            if(!foundPrompt){
                //looking for end of 'name'
                if(currentByte === 0){
                    foundPrompt = true;
                }
                else {
                    name += String.fromCharCode(currentByte);
                }
            } else {
                //looking for 'IDAT'
                prompt += String.fromCharCode(currentByte);
            
                if(prompt.endsWith('IDAT')){
                    prompt = prompt.replace(/(\r\n|\n|\r)/gm, " "); //remove newlines
                    promptParts = prompt.split(/.(?=Negative prompt:)|.(?=Steps:)/y); //split on 'Negative prompt:' or 'Steps:'
                    posPrompt = promptParts[0].split(","); //delimits on commas
                    negPrompt = promptParts[1] ? promptParts[1].split(","): []; //checks if there is a negative prompt delimits if so
                    metaPrompt = promptParts[2] ? promptParts[2].split(","): []; //checks if there is a meta prompt delimits if so
                    parsedPrompt = [posPrompt, negPrompt, metaPrompt]
                    return { prop: name, prompt: parsedPrompt};
                }
            }
        }
    }
}


function promptIndex(dataBuff:Buffer){
  const checkRange =  Math.min(48, dataBuff.length - 4);

  for(let j = 0; j < checkRange; j++){
      if(dataBuff[j] == 116 && dataBuff[j+1] == 69 && dataBuff[j+2] == 88 && dataBuff[j+3] == 116){
          return j + 4;
          
      }
  }

  return 0;
}