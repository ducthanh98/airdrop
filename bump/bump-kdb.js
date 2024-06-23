const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cliProgress = require('cli-progress');

const idsFilePath = path.join(__dirname, 'id.txt');
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const createQueue = () => {
    const tasks = [];
    let pendingPromise = false;

    return {
        addTask: (task) => {
            tasks.push(task);
            if (!pendingPromise) {
                pendingPromise = true;
                processQueue();
            }
        }
    };

    async function processQueue() {
        while (tasks.length > 0) {
            const task = tasks.shift();
            await task();
        }
        pendingPromise = false;
    }
};

const messageQueue = createQueue();

const checkProxyIP = async (proxy, progress) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent
        });
        if (response.status === 200) {
            messageQueue.addTask(() => progress.update({ status: `Địa chỉ IP của proxy: ${response.data.ip}` }));
        } else {
            messageQueue.addTask(() => progress.update({ status: `Không thể kiểm tra IP của proxy. Status code: ${response.status}` }));
        }
    } catch (error) {
        messageQueue.addTask(() => progress.update({ status: `Error khi kiểm tra IP của proxy: ${error.message}` }));
    }
};

const finishFarmingIfNeeded = async (farmingData, farmingHeaders, proxyAgent, progress) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (farmingData.session.status === 'inProgress' && currentTime > farmingData.session.moon_time) {
        try {
            const finishUrl = 'https://api.mmbump.pro/v1/farming/finish';
            const finishPayload = { tapCount: 0 };
            await axios.post(finishUrl, finishPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });
            messageQueue.addTask(() => progress.update({ status: 'Đã hoàn thành farming' }));

            const farmingStartUrl = 'https://api.mmbump.pro/v1/farming/start';
            const farmingStartPayload = { status: 'inProgress' };
            await axios.post(farmingStartUrl, farmingStartPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });
            messageQueue.addTask(() => progress.update({ status: 'Bắt đầu farming...' }));
        } catch (error) {
            messageQueue.addTask(() => progress.update({ status: `Lỗi khi hoàn thành farming: ${error.message}` }));
        }
    } else {
        messageQueue.addTask(() => progress.update({ status: 'Đang trong trạng thái farming' }));
    }
};

const xuly = async (telegramId, proxy, progress) => {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const authPayload = `telegram_id=${telegramId}`;

    let hash = null;
    let attempt = 1;
    while (!hash) {
        try {
            const authResponse = await axios.post(authUrl, authPayload, { headers: authHeaders, httpsAgent: proxyAgent });
            await sleep(10000); 
            if (authResponse.status === 200 && authResponse.data) {
                hash = authResponse.data.hash;
                messageQueue.addTask(() => progress.update({ status: `Xác thực thành công` }));
            } else {
                throw new Error('Không thể xác thực');
            }
        } catch (error) {
            messageQueue.addTask(() => progress.update({ status: `Lần thử ${attempt}: Lỗi khi xác thực: ${error.message}` }));
            await sleep(1000); 
        }
        attempt++;
    }

    if (!hash) {
        messageQueue.addTask(() => progress.update({ status: 'Không thể xác thực sau nhiều lần thử' }));
        return;
    }

    try {
        const farmingUrl = 'https://api.mmbump.pro/v1/farming';
        const farmingHeaders = {
            ...authHeaders,
            'Authorization': hash
        };

        const farmingResponse = await axios.get(farmingUrl, { headers: farmingHeaders, httpsAgent: proxyAgent });
        await sleep(1000); 
        if (farmingResponse.status === 200 && farmingResponse.data) {
            const farmingData = farmingResponse.data;
            messageQueue.addTask(() => progress.update({ status: `ID: ${farmingData.telegram_id}, Balance: ${farmingData.balance}` }));
            await sleep(10000); 
            const currentTime = Math.floor(Date.now() / 1000);
            if (farmingData.day_grant_first === null || (currentTime - farmingData.day_grant_first) >= 86400) {
                const grantDayClaimUrl = 'https://api.mmbump.pro/v1/grant-day/claim';
                await axios.post(grantDayClaimUrl, {}, { headers: farmingHeaders, httpsAgent: proxyAgent });
                messageQueue.addTask(() => progress.update({ status: 'Điểm danh hàng ngày' }));
            } else {
                messageQueue.addTask(() => progress.update({ status: 'Đã điểm danh hàng ngày' }));
            }
            await sleep(10000); 
            if (farmingData.session.status === 'await') {
                const farmingStartUrl = 'https://api.mmbump.pro/v1/farming/start';
                const farmingStartPayload = { status: 'inProgress' };
                await axios.post(farmingStartUrl, farmingStartPayload, { headers: farmingHeaders, httpsAgent: proxyAgent });
                messageQueue.addTask(() => progress.update({ status: 'Bắt đầu farming...' }));
            } else if (farmingData.session.status === 'inProgress' && farmingData.session.moon_time > currentTime) {
                messageQueue.addTask(() => progress.update({ status: 'Đang trong trạng thái farming' }));
            } else {
                await finishFarmingIfNeeded(farmingData, farmingHeaders, proxyAgent, progress);
            }
            await finishFarmingIfNeeded(farmingData, farmingHeaders, proxyAgent, progress);
            await sleep(1000); 
        } else {
            messageQueue.addTask(() => progress.update({ status: 'Không thể lấy dữ liệu farming' }));
        }
    } catch (error) {
        messageQueue.addTask(() => progress.update({ status: `Lỗi rồi: ${error.message}` }));
    }
};

const clearConsole = () => {
    process.stdout.write('\x1Bc');
};

const main = async () => {
    while (true) {
        clearConsole();
        const progressBars = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: '{telegramId} | {bar} | {status}'
        }, cliProgress.Presets.shades_classic);

        const tasks = telegramIds.map((telegramId, index) => {
            const proxy = proxies[index].trim();
            const progress = progressBars.create(100, 0, { telegramId: telegramId.trim(), status: 'Bắt đầu...' });

            return (async () => {
                await checkProxyIP(proxy, progress);
                await sleep(1000); 
                await xuly(telegramId.trim(), proxy, progress);
                await sleep(1000); 
                progress.update(100, { status: 'Hoàn thành' });
            })();
        });

        await Promise.all(tasks);

        messageQueue.addTask(() => progressBars.stop());

        console.log('Đã hoàn thành tất cả các ID, nghỉ 6 giờ trước khi tiếp tục vòng lặp...');
        await new Promise(resolve => setTimeout(resolve, 6 * 60 * 60 * 1000)); 
    }
};

main();