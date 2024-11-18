const { spawn } = require('child_process');

const child = spawn('node', ['procFiles.ts'], {
    detached: false
});

child.on('exit', function(code: any, signal: any){
    console.log('child process exited with code ${code} and signal ${signal}');
});

child.on('error', (err: Error) => {
    console.error(`child process error: ${err}`);
});

child.stdout.on('data', (data: Buffer) => {
    console.log(`stdout: ${data.toString()}`);
});

child.stderr.on('data', (data: Buffer) => {
    console.error(`stderr: ${data.toString()}`);
});