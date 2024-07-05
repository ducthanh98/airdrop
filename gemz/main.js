const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cliProgress = require('cli-progress');

const BASE_URL = 'https://gemzcoin.us-east-1.replicant.gc-internal.net/gemzcoin/v2.31.1'

function taoSid() {
    return crypto.randomBytes(6).toString('base64').slice(0, 9);
}

const docQuery = path.join(__dirname, 'query.txt');
const xulyQuery = fs.readFileSync(docQuery, 'utf8');
const docProxy = path.join(__dirname, 'proxy.txt');
const xulyProxy = fs.readFileSync(docProxy, 'utf8');
const queryIds = xulyQuery.split('\n').map(line => line.trim()).filter(line => line);
const proxies = xulyProxy.split('\n').map(line => line.trim()).filter(line => line);

function checkEnergy(energy) {
    return energy > 30;
}

const checkProxyIP = async (proxy, progress) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent
        });
        if (response.status === 200) {
            progress.update({ status: `Địa chỉ IP của proxy: ${response.data.ip}` });
        } else {
            progress.update({ status: `Không thể kiểm tra IP của proxy. Status code: ${response.status}` });
        }
    } catch (error) {
        progress.update({ status: `Error khi kiểm tra IP của proxy: ${error.message}` });
    }
};

async function xuly(queryId, proxy, progress) {
    await checkProxyIP(proxy, progress);

    const queryParams = new URLSearchParams(queryId);
    const user = JSON.parse(decodeURIComponent(queryParams.get('user')));

    const firstName = user.first_name;
    const lastName = user.last_name;
    const userIdMatch = queryParams.get('user').match(/"id":(\d+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    if (!userId) {
        progress.update({ status: `Không tìm thấy user id: ${queryId}` });
        return;
    }

    const payload1 = {
        sid: taoSid(),
        id: userId,
        auth: queryId.replace(/&/g, '\n')
    };

    const config1 = {
        method: 'post',
        url: BASE_URL + '/loginOrCreate',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
            'Content-Type': 'application/json',
            'Origin': 'https://ff.notgemz.gemz.fun',
            'Referer': 'https://ff.notgemz.gemz.fun/',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
        },
        data: payload1,
        httpsAgent: new HttpsProxyAgent(proxy)
    };

    try {
        const response1 = await axios(config1);
        const data = response1.data.data;

        if (!data || !data.state || !data.token) {
            progress.update({ status: `Dữ liệu phản hồi không hợp lệ: ${JSON.stringify(response1.data)}` });
            return;
        }

        progress.update({ first_name: firstName, last_name: lastName, status: `Username: ${data.state.username}, Balance: ${data.state.balance}, Energy: ${data.state.energy}` });

        let rev = data.rev;
        let currentEnergy = data.state.energy;

        while (checkEnergy(currentEnergy)) {
            const queueLength = Math.floor(Math.random() * 16) + 5;
            const queue = [];
            for (let i = 0; i < queueLength; i++) {
                queue.push({ "fn": "tap", "async": false, "meta": { "now": Date.now() } });
            }

            const payload2 = {
                "abTestsDynamicConfig": {
                    "0002_invite_drawer": { "active": true, "rollOut": 1 },
                    "0003_invite_url": { "active": true, "rollOut": 1 },
                    "0004_invite_copy": { "active": true, "rollOut": 1 },
                    "0010_localization": { "active": true, "rollOut": 1 },
                    "0006_daily_reward": { "active": false, "rollOut": 0 },
                    "0011_earn_page_buttons": { "active": true, "rollOut": 1 },
                    "0005_invite_message": { "active": true, "rollOut": 1 },
                    "0008_retention_with_points": { "active": true, "rollOut": 1 },
                    "0018_earn_page_button_2_friends": { "active": true, "rollOut": 1 },
                    "0012_rewards_summary": { "active": true, "rollOut": 1 },
                    "0022_localization": { "active": true, "rollOut": 1 },
                    "0023_earn_page_button_connect_wallet": { "active": true, "rollOut": 1 },
                    "0016_throttling": { "active": true, "rollOut": 1 },
                    "0024_rewards_summary2": { "active": true, "rollOut": 1 },
                    "0016_throttling_v2": { "active": true, "rollOut": 1 },
                    "0014_gift_airdrop": { "active": true, "rollOut": 1 },
                    "0007_game_preview": { "active": true, "rollOut": 1 },
                    "0015_dao_card": { "active": true, "rollOut": 1 }
                },
                "queue": queue,
                "rev": rev,
                "requestedProfileIds": [],
                "consistentFetchIds": [],
                "sid": taoSid(),
                "clientRandomSeed": 0,
                "crqid": taoSid(),
                "id": userId,
                "auth": data.token
            };

            const config2 = {
                method: 'post',
                url: BASE_URL + '/replicate',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'Content-Type': 'application/json',
                    'Origin': 'https://ff.notgemz.gemz.fun',
                    'Referer': 'https://ff.notgemz.gemz.fun/',
                    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'Sec-Ch-Ua-Mobile': '?1',
                    'Sec-Ch-Ua-Platform': '"Android"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
                },
                data: payload2,
                httpsAgent: new HttpsProxyAgent(proxy)
            };

            try {
                const response2 = await axios(config2);
                const responseData = response2.data.data;

                if (!responseData || !responseData.state) {
                    progress.update({ status: `Đang tap...rev ${responseData.rev}` });
                }

                rev = response2.data.data.rev;
                currentEnergy -= queueLength;

            } catch (error) {
                progress.update({ status: `Lỗi rồi: ${error.response ? error.response.data : error.message}` });
                break;
            }

 //           await new Promise(resolve => setTimeout(resolve, Math.random() * 4000 + 3000));
        }

        if (data.state.unclaimed_rewards === 0) {
            const payload3 = {
                "abTestsDynamicConfig": {
                    "0002_invite_drawer": { "active": true, "rollOut": 1 },
                    "0003_invite_url": { "active": true, "rollOut": 1 },
                    "0004_invite_copy": { "active": true, "rollOut": 1 },
                    "0010_localization": { "active": true, "rollOut": 1 },
                    "0006_daily_reward": { "active": false, "rollOut": 0 },
                    "0011_earn_page_buttons": { "active": true, "rollOut": 1 },
                    "0005_invite_message": { "active": true, "rollOut": 1 },
                    "0008_retention_with_points": { "active": true, "rollOut": 1 },
                    "0018_earn_page_button_2_friends": { "active": true, "rollOut": 1 },
                    "0012_rewards_summary": { "active": true, "rollOut": 1 },
                    "0022_localization": { "active": true, "rollOut": 1 },
                    "0023_earn_page_button_connect_wallet": { "active": true, "rollOut": 1 },
                    "0016_throttling": { "active": true, "rollOut": 1 },
                    "0024_rewards_summary2": { "active": true, "rollOut": 1 },
                    "0016_throttling_v2": { "active": true, "rollOut": 1 },
                    "0014_gift_airdrop": { "active": true, "rollOut": 1 }
                },
                "queue": [{ "fn": "claimDailyReward", "async": false }],
                "rev": data.rev, 
                "requestedProfileIds": [],
                "consistentFetchIds": [],
                "sid": taoSid(),
                "clientRandomSeed": 0,
                "crqid": taoSid(),
                "id": userId,
                "auth": data.token
            };

            const config3 = {
                method: 'post',
                url: BASE_URL + '/replicate',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'Content-Type': 'application/json',
                    'Origin': 'https://ff.notgemz.gemz.fun',
                    'Referer': 'https://ff.notgemz.gemz.fun/',
                    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'Sec-Ch-Ua-Mobile': '?1',
                    'Sec-Ch-Ua-Platform': '"Android"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
                },
                data: payload3,
                httpsAgent: new HttpsProxyAgent(proxy)
            };

            try {
                const response3 = await axios(config3);
                progress.update({ status: `Đã gọi API claimDailyReward` });
            } catch (error) {
                progress.update({ status: `Lỗi khi gọi API claimDailyReward: ${error.response ? error.response.data : error.message}` });
            }
        }
        progress.update(100, { status: 'Hoàn thành' });

    } catch (error) {
        progress.update({ status: `Lỗi: ${error.message}` });
    }
}

const clearConsole = () => {
    process.stdout.write('\x1Bc');
};

async function runTasks() {
    clearConsole();
    const progressBars = new cliProgress.MultiBar({
        format: '{first_name} {last_name} | {bar} | {status}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    const tasks = queryIds.map((queryId, index) => {
        const proxy = proxies[index % proxies.length];
        const user = JSON.parse(decodeURIComponent(new URLSearchParams(queryId).get('user')));
        const firstName = user.first_name;
        const lastName = user.last_name;

        const progress = progressBars.create(100, 0, { first_name: firstName, last_name: lastName, status: 'Bắt đầu...' });

        return (async () => {
            await xuly(queryId, proxy, progress);
            progress.stop();
        })();
    });

    await Promise.all(tasks);
    progressBars.stop();
    console.log('Tất cả các tác vụ đã hoàn thành.');
}

(async () => {
    while (true) {
        await runTasks();
        console.log('Đang nghỉ 15 phút...');
        await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
    }
})();
