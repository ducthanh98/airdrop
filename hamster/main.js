const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyFilePath = path.join(__dirname, 'proxy.txt');
const proxies = fs.readFileSync(proxyFilePath, 'utf8').trim().split('\n');

const csvData = fs.readFileSync('query.txt', 'utf8');
const authorizationList = csvData.split('\n').map(line => line.trim()).filter(line => line !== '');

const dancay = axios.create({
    baseURL: 'https://api.hamsterkombat.io',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
});

async function clickWithAPI(authorization, proxyAgent) {
    try {
        const payload = {
            count: 1,
            availableTaps: 1500,
            timestamp: Date.now()
        };

        const response = await dancay.post('/clicker/tap', payload, {
            headers: {
                'Authorization': `Bearer ${authorization}`
            },
            httpsAgent: proxyAgent
        });

        if (response.status === 200) {
            const data = response.data;
            const clickerUser = data.clickerUser;
            const requiredFields = {
                Balance: clickerUser.balanceCoins,
                Level: clickerUser.level,
                availableTaps: clickerUser.availableTaps,
                maxTaps: clickerUser.maxTaps
            };
            console.log('Đang tap:', requiredFields);
            return requiredFields;
        } else {
            console.error('Không bấm được. Status code:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

async function checkTasks(authorization, proxyAgent) {
    try {
        const response = await dancay.post('/clicker/list-tasks', {}, {
            headers: {
                'Authorization': `Bearer ${authorization}`
            },
            httpsAgent: proxyAgent
        });

        if (response.status === 200) {
            const tasks = response.data.tasks;
            for (const task of tasks) {
                if (task.id === 'streak_days' && !task.isCompleted) {
                    await dancay.post('/clicker/check-task', { taskId: 'streak_days' }, {
                        headers: {
                            'Authorization': `Bearer ${authorization}`
                        },
                        httpsAgent: proxyAgent
                    });
                    console.log(`Đã điểm danh hàng ngày cho token ${authorization}`);
                }
            }

            const boostsResponse = await dancay.post('/clicker/boosts-for-buy', {}, {
                headers: {
                    'Authorization': `Bearer ${authorization}`
                },
                httpsAgent: proxyAgent
            });

            if (boostsResponse.status === 200 && boostsResponse.data.boostsForBuy) {
                const boosts = boostsResponse.data.boostsForBuy;
                const boostFullAvailableTaps = boosts.find(boost => boost.id === 'BoostFullAvailableTaps');
                if (boostFullAvailableTaps && boostFullAvailableTaps.cooldownSeconds === 0) {
                    const buyBoostPayload = {
                        boostId: 'BoostFullAvailableTaps',
                        timestamp: Math.floor(Date.now() / 1000)
                    };
                    await dancay.post('/clicker/buy-boost', buyBoostPayload, {
                        headers: {
                            'Authorization': `Bearer ${authorization}`
                        },
                        httpsAgent: proxyAgent
                    });
                    console.log(`Đã mua Full Energy cho token ${authorization}`);
                }
            } else {
                console.error('Không lấy được danh sách boosts. Status code:', boostsResponse.status);
            }
        } else {
            console.error('Không lấy được danh sách nhiệm vụ. Status code:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function runForAuthorization(authorization,proxyAgent) {
    await checkTasks(authorization,proxyAgent);

    while (true) {
        const requests = Array.from({ length: 5 }, () => clickWithAPI(authorization));
        const results = await Promise.all(requests);
        const clickData = results[results.length - 1];
        if (clickData && clickData.availableTaps < 10) {
            console.log(`Token ${authorization.substring(0, 10)}... có năng lượng nhỏ hơn 10. Chuyển token tiếp theo...`);
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}


const checkProxyIP = async (token,proxy) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxy
        });
        if (response.status === 200) {
            console.log(`token ${token} takes:`, response.data.ip);
        } else {
            console.error('Check proxy ip error. Status code:', response.status);
        }
    } catch (error) {
        console.error('Check proxy error:', error);
    }
};

async function main() {
    while (true) {
        for (let i = 0; i < authorizationList.length; i++) {
            console.log('==================START==================')
            const proxy = proxies[i % proxies.length].trim()
            const proxyAgent = new HttpsProxyAgent(proxy)
            await checkProxyIP(authorizationList[i],proxyAgent)
            await runForAuthorization(authorizationList[i],proxyAgent);
            console.log('==================END==================')

        }
        console.log('Đã chạy xong tất cả các token, nghỉ 1 giây rồi chạy lại từ đầu...');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

main();
