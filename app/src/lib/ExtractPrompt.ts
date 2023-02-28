

export default function promptDecode(data:Buffer) {
    let text = '';
    let name = '';
    let param = false;
    let debugLim = 2048;
    let i = promptIndex(data)
    console.log(i);

    if (i){
        while(!param){
            let code = data[i]
            console.log(code.toString(16))
            if( code == 0 && !param){
                console.log("found 00 char")
                param = true;
                break;
            }
            name += String.fromCharCode(code);
            i++;
        }
        i++;
        console.log(i);
        while(param){
            let code = data[i]
            text += String.fromCharCode(code);
            
            if(code == 73 ){
                console.log("found code == 73");
                console.log(data[i+1])
                if(data[i+1] == 68, data[i+2] == 65, data[i+3] == 84) {

                    console.log("return condition")
                    param = false;
                    return {
                        prop:name,
                        prompt:text
                    }
                }
            }
            if(i >= debugLim){
                param = false;
            }
            i++;
        }
    }
    else{
        // 
        console.log("found none")
        return {
            prop:'',
            prompt: "No Prompt Found" 
        };
    }
}


function promptIndex(dataBuff:Buffer){
    const checkRange = 48;
    let checkBuff = dataBuff.slice(0,checkRange)

    for(let j = 0; j < checkRange; j++){
        if(checkBuff[j] == 116){
            if(checkBuff[j+1] == 69 && checkBuff[j+2] == 88 && checkBuff[j+3] == 116 ){
                console.log("found tEXT");
                return j + 4;
            }
        }
    }

    return 0;
}