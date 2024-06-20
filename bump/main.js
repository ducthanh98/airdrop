const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');
const readline = require('readline');

const idsFilePath = path.join(__dirname, 'query.txt');
const telegramIds = fs.readFileSync(idsFilePath, 'utf8').trim().split('\n');

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


const xuly = async (telegramId, progress) => {
    const authPayload = `telegram_id=${telegramId}`;

    try {
        const authResponse = await axios.post(authUrl, authPayload, { headers: authHeaders});
        if (authResponse.status === 200) {
            const hash = authResponse.data.hash;

            const farmingUrl = 'https://api.mmbump.pro/v1/farming';
            const farmingHeaders = {
                ...authHeaders,
                'Authorization': hash
            };

            const farmingResponse = await axios.get(farmingUrl, { headers: farmingHeaders });
            if (farmingResponse.status === 200) {
                const farmingData = farmingResponse.data;
                progress.update({ status: `ID: ${farmingData.telegram_id}, Balance: ${farmingData.balance}` });
                const currentTime = Math.floor(Date.now() / 1000);
                if (farmingData.day_grant_first === null || (currentTime - farmingData.day_grant_first) >= 86400) {
                    const grantDayClaimUrl = 'https://api.mmbump.pro/v1/grant-day/claim';
                    await axios.post(grantDayClaimUrl, {}, { headers: farmingHeaders });
                    progress.update({ status: 'Điểm danh hàng ngày' });
                } else {
                    progress.update({ status: 'Đã điểm danh hàng ngày' });
                }

                if (farmingData.session.status === 'await') {
                    const farmingStartUrl = 'https://api.mmbump.pro/v1/farming/start';
                    const farmingStartPayload = { status: 'inProgress' };
                    await axios.post(farmingStartUrl, farmingStartPayload, { headers: farmingHeaders });
                    progress.update({ status: 'Bắt đầu farming...' });
                } else {
                    progress.update({ status: 'Đang trong trạng thái farming' });
                }
            } else {
                progress.update({ status: 'Không thể lấy dữ liệu farming' });
            }
        } else {
            throw new Error('Không thể xác thực');
        }
    } catch (error) {
        progress.update({ status: `Lỗi rồi: ${error.message}` });
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
            const progress = progressBars.create(100, 0, { telegramId: telegramId.trim(), status: 'Bắt đầu...' });

            return (async () => {
                await xuly(telegramId.trim(), progress);
                progress.update(100, { status: 'Hoàn thành' });
                progress.stop();
            })();
        });

        await Promise.all(tasks);
        progressBars.stop();
        console.log('Đã hoàn thành tất cả các ID, nghỉ 6 giờ trước khi tiếp tục vòng lặp...');
        await new Promise(resolve => setTimeout(resolve, 6 * 60 * 60 * 1000 + 10 * 60 * 1000));
    }
};

main();