const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

const idsFilePath = path.join(__dirname, 'query.txt');
const telegramIds = fs.readFileSync(idsFilePath, 'utf8').trim().split('\n');
const proxyFilePath = path.join(__dirname, 'proxy.txt');
const proxies = fs.readFileSync(proxyFilePath, 'utf8').trim().split('\n');

const authUrl = 'https://api.mmbump.pro/v1/auth';
const authHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'https://mmbump.pro',
    'Referer': 'https://mmbump.pro/',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
};

const checkProxyIP = async (proxy) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent
        });
        if (response.status === 200) {
            console.log('\nYour proxy ip is:', response.data.ip);
        } else {
            console.error('Check proxy ip error. Status code:', response.status);
        }
    } catch (error) {
        console.error('Check proxy error:', error);
    }
};

const finishFarmingIfNeeded = async (farmingData, farmingHeaders, proxyAgent) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (farmingData.session.status === 'inProgress' && currentTime > farmingData.session.moon_time) {
        try {
            const rdTapCount = Math.floor(Math.random() * (150000 - 50000 + 1)) + 50000;
            const finishUrl = 'https://api.mmbump.pro/v1/farming/finish';
            const finishPayload = { tapCount: rdTapCount };

            const finishResponse = await axios.post(finishUrl, finishPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });

            if (finishResponse.status === 200) {
                console.log('Finish farming');

                const farmingStartUrl = 'https://api.mmbump.pro/v1/farming/start';
                const farmingStartPayload = { status: 'inProgress' };

                const startResponse = await axios.post(farmingStartUrl, farmingStartPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });

                if (startResponse.status === 200) {
                    console.log('Start farming...');
                } else {
                    console.error('Start farming error:', startResponse.data);
                }
            } else {
                console.error('Start farming error:', finishResponse.data);
            }
        } catch (error) {
            console.error('Finish farming error:', error.message);
            if (error.response) {
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            }
        }
    } else {
        console.log(' farming: in progress');
    }
};

const xuly = async (telegramId, proxy) => {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const authPayload = `telegram_id=${telegramId}`;

    try {
        const authResponse = await axios.post(authUrl, authPayload, { headers: authHeaders, httpsAgent: proxyAgent });
        if (authResponse.status === 200) {
            const hash = authResponse.data.hash;

            const farmingUrl = 'https://api.mmbump.pro/v1/farming';
            const farmingHeaders = {
                ...authHeaders,
                'Authorization': hash
            };

            let farmingData;
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
                const farmingResponse = await axios.get(farmingUrl, { headers: farmingHeaders, httpsAgent: proxyAgent });
                if (farmingResponse.status === 200) {
                    farmingData = farmingResponse.data;
                    if (farmingData.telegram_id !== undefined && farmingData.balance !== undefined) {
                        break;
                    }
                }
                attempts++;
                console.log(`attempts: ${attempts} fetch farming data...`);
            }

            if (farmingData && farmingData.telegram_id !== undefined && farmingData.balance !== undefined) {
                console.log('========================================');
                console.log('ID:', farmingData.telegram_id);
                console.log('Balance:', farmingData.balance);
                console.log('===============================================');
                const currentTime = Math.floor(Date.now() / 1000);

                try {
                    if (farmingData.day_grant_first === null || (currentTime - farmingData.day_grant_first) >= 86400) {
                        const grantDayClaimUrl = 'https://api.mmbump.pro/v1/grant-day/claim';
                        await axios.post(grantDayClaimUrl, {}, { headers: farmingHeaders, httpsAgent: proxyAgent });
                        console.log('Daily checkin');
                    } else {
                        console.log('Daily checkin');
                    }
                } catch (grantError) {
                    if (grantError.response && grantError.response.status === 400) {
                        console.log('Daily checkin');
                    } else {
                        throw grantError;
                    }
                }

                if (farmingData.session.status === 'await') {
                    const farmingStartUrl = 'https://api.mmbump.pro/v1/farming/start';
                    const farmingStartPayload = { status: 'inProgress' };
                    await axios.post(farmingStartUrl, farmingStartPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });
                    console.log('Start farming...');
                } else if (farmingData.session.status === 'inProgress' && farmingData.session.moon_time > currentTime) {
                    console.log('Farming: inProgress');
                } else {
                    await finishFarmingIfNeeded(farmingData, farmingHeaders, proxyAgent);
                }
            } else {
                console.error('Fetch farming data error');
            }
        } else {
            throw new Error('Auth failed');
        }
    } catch (error) {
        console.error('Unknown error:', error);
    }
};

const animatedLoading = (durationInMilliseconds) => {
    const frames = ["|", "/", "-", "\\"];
    const endTime = Date.now() + durationInMilliseconds;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const remainingTime = Math.floor((endTime - Date.now()) / 1000);
            const frame = frames[Math.floor(Date.now() / 250) % frames.length];
            process.stdout.write(`\rWaiting ${frame} - Remaining ${remainingTime} second...`);
            if (Date.now() >= endTime) {
                clearInterval(interval);
                process.stdout.write("\rWaiting the next request.\n");
                resolve();
            }
        }, 250);
    });
};

const main = async () => {
    while (true) {
        for (let i = 0; i < telegramIds.length; i++) {
            const telegramId = telegramIds[i].trim();
            const proxy = proxies[i].trim();
            await checkProxyIP(proxy);
            await xuly(telegramId, proxy);
        }
        await animatedLoading(6 * 60 * 60 * 1000);
    }
};

main();
