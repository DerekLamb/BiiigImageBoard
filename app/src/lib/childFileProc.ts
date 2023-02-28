import { refreshFiles } from "./processFiles";

const { spawn } = require('child_process');

const child = spawn('node', ['procFiles.ts'], {
    detached: true,
    stdio: 'ignore'
});

child.on('exit', function(code: any, signal: any){
    console.log('child process exited with code ${code} and signal ${signal}');
});