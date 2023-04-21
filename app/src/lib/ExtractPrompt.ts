export default function promptDecode(data:Buffer) {
    let prompt = '';
    let name = '';
    let foundPrompt = false;
    const limit = Math.min(data.length, 2048);
    let i = promptIndex(data)
    const startIndex = promptIndex(data);
    console.log(i);

    if (startIndex){
        for( let i = startIndex; i < limit; i +=1){
            const currentByte = data[i];

            if(!foundPrompt){
                //looking for end of 'name'
                if(currentByte === 0){
                    foundPrompt = true;
                    i += 1; //skipping null char
                }
                else {
                    name += String.fromCharCode(currentByte);
                }
            } else {
                //looking for 'IDAT'
                prompt += String.fromCharCode(currentByte);
            
                if(prompt.endsWith('IDAT')){
                    return { prop: name, prompt };
                }
            }
        }
    }
}


function promptIndex(dataBuff:Buffer){
    const checkRange = 48;
    const checkBuff = dataBuff.subarray(0,checkRange)
    const uint32Arr = new Uint32Array(checkBuff.buffer);

    for (let j = 0; j < checkRange / Uint32Array.BYTES_PER_ELEMENT; j += 1) {
        if (uint32Arr[j] === 0x54784574 /* 'tEXT' */) {
          return j * Uint32Array.BYTES_PER_ELEMENT + 4;
        }
      }

    return 0;
}