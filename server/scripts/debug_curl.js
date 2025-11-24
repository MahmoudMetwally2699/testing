const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const keyId = process.env.ETG_KEY_ID;
const apiKey = process.env.ETG_API_KEY;
const auth = Buffer.from(`${keyId}:${apiKey}`).toString('base64');

// Hash from recent logs
const hash = "h-d971a5ce-8bd3-5f27-9b41-9bf70eb0198d";

const cmd = `curl -X POST "https://api.worldota.net/api/b2b/v3/hotel/prebook/" -H "Content-Type: application/json" -H "Authorization: Basic ${auth}" -d "{\\"hash\\": \\"${hash}\\"}"`;

console.log('Running curl...');
exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        fs.writeFileSync('curl_output.txt', `Error: ${error.message}\nStderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    fs.writeFileSync('curl_output.txt', stdout);
});
