const path = require('path');
const fs = require('fs');

const trickProxies = [];
const proxyFilePath = path.join(__dirname, 'proxy.txt');
const proxies = fs.readFileSync(proxyFilePath, 'utf8').trim().split('\n');

async function main() {
    for (let i =0; i< proxies.length;i++) {
        const proxyUrl = proxies[i];
        const proxyChain = require('proxy-chain');


        // Anonymize proxyUrl
        const anonymizedProxy = await proxyChain.anonymizeProxy(proxyUrl);

        // Parse anonymized proxy URL
        const parsedUrl = new URL(anonymizedProxy);

        // Extract the host and port
        const proxyHost = parsedUrl.hostname;
        const proxyPort = parsedUrl.port;

        // Construct the new proxy string
        const newProxyString = `${proxyHost}:${proxyPort}`;
        trickProxies.push(newProxyString)
    }
    console.log(trickProxies)

}

main();

const express = require('express');
const app = express();
app.get('*', (req, res)=> {
    return res.json({res: trickProxies});
})

app.listen(3000)
