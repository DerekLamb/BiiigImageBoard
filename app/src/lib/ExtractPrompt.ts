export default function promptDecode(data:Buffer) {
    let prompt = '';
    let promptParts = [];
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
                  promptParts = prompt.split(',');
                    return { prop: name, prompt: promptParts };
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