const axios = require('axios');
const fs = require('fs');
const readlineSync = require('readline-sync');
const { exec } = require('child_process');

function clearConsole() {
    if (process.platform === 'win32') {
        exec('cls');
    } else {
        exec('clear');
    }
}

function loadCredentials() {
    try {
        const credentialsList = fs.readFileSync('authorization.txt', 'utf8').split('\n');
        const credentials = credentialsList.map(cred => cred.trim());
        return credentials;
    } catch (error) {
        console.error("Không tìm thấy file 'authorization.txt'. Đảm bảo file nằm trong cùng thư mục với nhau.");
        return [];
    }
}

async function fetchTaskIds(apikey, authorization) {
    const url = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/get_filtered_tasks';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'content-profile': 'public',
        'content-type': 'application/json',
        'origin': 'https://dot.dapplab.xyz',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
        'x-client-info': 'postgrest-js/1.9.2',
        'x-telegram-user-id': '6726676206'
    };
    const data = { 'platform': 'ios', 'locale': 'en', 'is_premium': false };
    try {
        const response = await axios.post(url, data, { headers });
        if (response.status === 200) {
            const tasks = response.data;
            const taskIds = tasks.map(task => task.id);
            return taskIds;
        } else {
            console.error(`Không tìmđược nhiệm vụ, status code: ${response.status}`);
            return [];
        }
    } catch (error) {
        console.error(`Lỗi rồi: ${error}`);
        return [];
    }
}

async function addAttempts(lvl, apikey, authorization, currentLevel) {
    const url = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/add_attempts';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'content-profile': 'public',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://dot.dapplab.xyz',
        'priority': 'u=1, i',
        'referer': 'https://dot.dapplab.xyz/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'x-client-info': 'postgrest-js/1.9.2'
    };

    while (true) {
        process.stdout.write(`[ Upgrade ] : Nâng lên cấp độ ${lvl}\r`);
        try {
            const data = { 'lvl': lvl };
            const response = await axios.post(url, data, { headers });
            const responseData = response.data;
            if (lvl > currentLevel) {
                return false;
            }
            if (responseData.success) {
                return true;
            } else {
                lvl += 1;
            }
        } catch (error) {
            console.error(`Lỗi khi nâng cấp: ${error}`);
        }
    }
}

async function autoClearTask(apikey, authorization) {
    const taskIds = await fetchTaskIds(apikey, authorization);
    const baseUrl = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/complete_task';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'content-profile': 'public',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://dot.dapplab.xyz',
        'priority': 'u=1, i',
        'referer': 'https://dot.dapplab.xyz/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'x-client-info': 'postgrest-js/1.9.2',
        'x-telegram-user-id': '7003565657'
    };
    for (const taskId of taskIds) {
        const data = { 'oid': String(taskId) };
        try {
            const response = await axios.post(baseUrl, data, { headers });
            if (response.status === 200) {
                console.log(`[ Task ${taskId} ] : Hoàn thành`);
            } else {
                console.log(`[ Task ${taskId} ] : Không thành công với mã trạng thái ${response.status}`);
            }
        } catch (error) {
            console.error(`Lỗi hoàn thành nhiệm vụ ${taskId}: ${error}`);
        }
    }
}

async function saveCoins(coins, apikey, authorization) {
    const url = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/save_coins';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'content-profile': 'public',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://dot.dapplab.xyz',
        'priority': 'u=1, i',
        'referer': 'https://dot.dapplab.xyz/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'x-client-info': 'postgrest-js/1.9.2'
    };
    const data = { 'coins': coins };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi nhận coin: ${error}`);
        return false;
    }
}

async function getUserInfo(apikey, authorization) {
    const url = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/get_user_info';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'content-profile': 'public',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://dot.dapplab.xyz',
        'priority': 'u=1, i',
        'referer': 'https://dot.dapplab.xyz/',
        'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome 125.0.0.0 Safari/537.36',
        'x-client-info': 'postgrest-js/1.9.2'
    };
    const data = {};
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error(`Không lấy được thông tin người dùng: ${error}`);
        return null;
    }
}

function autoUpgradeDailyAttempt() {
    const userInput = readlineSync.question("Auto upgrades daily attempt (y/n): ").trim().toLowerCase();
    if (userInput === 'y') {
        try {
            const nUpgrade = parseInt(readlineSync.question("Number of upgrades? "), 10);
            return isNaN(nUpgrade) ? 0 : nUpgrade;
        } catch (error) {
            console.error("Dữ liệu nhập không hợp lệ, phải là số.");
            return 0;  
        }
    }
    return 0; 
}

async function autoGame(apikey, authorization, coins) {
    const url = 'https://jjvnmoyncmcewnuykyid.supabase.co/rest/v1/rpc/try_your_luck';
    const headers = {
        'accept': '*/*',
        'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
        'apikey': apikey,
        'authorization': `Bearer ${authorization}`,
        'cache-control': 'no-cache',
        'content-profile': 'public',
        'content-type': 'application/json',
        'origin': 'https://dot.dapplab.xyz',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://dot.dapplab.xyz/',
        'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24", "Microsoft Edge WebView2";v="125"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
        'x-client-info': 'postgrest-js/1.9.2',
    };
    const data = { 'coins': coins };
    try {
        const response = await axios.post(url, data, { headers });
        const responseData = response.data;
        if (responseData.success) {
            console.log(`[ Game ] : Thắng`);
        } else {
            console.log(`[ Game ] : Thua`);
        }
    } catch (error) {
        console.error(`Lỗi rồi: ${error}`);
    }
}

async function main() {
    const clearTask = readlineSync.question("Auto Complete Task? (y/n): ").trim().toLowerCase() || 'n';
    const credentials = loadCredentials();
    const nUpgrade = autoUpgradeDailyAttempt(); 
    const upgradeSuccess = {}; 

    const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdm5tb3luY21jZXdudXlreWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg3MDE5ODIsImV4cCI6MjAyNDI3Nzk4Mn0.oZh_ECA6fA2NlwoUamf1TqF45lrMC0uIdJXvVitDbZ8';

    while (true) {  
        for (let index = 0; index < credentials.length; index++) {
            const authorization = credentials[index];
            const info = await getUserInfo(apikey, authorization);
            console.log(`============== [ Tài khoản ${index} | ${info.first_name} ] ==============`);

            if (!upgradeSuccess[authorization]) {  
                if (nUpgrade > 0) {  
                    for (let i = 0; i < nUpgrade; i++) {
                        const currentLevel = info.daily_attempts;
                        const success = await addAttempts(0, apikey, authorization, currentLevel);
                        if (success) {
                            upgradeSuccess[authorization] = true;  
                            console.log(`[ Upgrade ] : Thành công\r`);
                            break;
                        } else {
                            console.log(`[ Upgrade ] : Thất bại\r`);
                        }
                    }
                }
            }

            if (info) {
                if (clearTask === 'y') {
                    await autoClearTask(apikey, authorization);
                }
                console.log(`[ Level ] : ${info.level}`);
                console.log(`[ Balance ] : ${info.balance}`);
                console.log(`[ Energy ] : ${info.daily_attempts}`);
                console.log(`[ Limit Energy ] : ${info.limit_attempts}`);
                console.log(`[ Multitap Level ] : ${info.multiple_clicks}`);
                await autoGame(apikey, authorization, 150000);
                const energy = info.daily_attempts;
                if (energy > 0) {
                    for (let i = 0; i < energy; i++) {
                        process.stdout.write(`[ Tap ] : Tapping...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        await saveCoins(20000, apikey, authorization);
                        console.log(`Thành công`);
                    }
                } else {
                    console.log("Năng lượng đã hết. Chờ nạp năng lượng...");
                }
            } else {
                console.log("Token không hợp lệ, chuyển tài khoản tiếp theo");
            }
        }

        console.log("==============Tất cả tài khoản đã được xử lý=================");
        for (let i = 600; i > 0; i--) {
            process.stdout.write(`\rBắt đầu vòng lặp sau ${i} giây...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(); 

        clearConsole();
    }
}

main();