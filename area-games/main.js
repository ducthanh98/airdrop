const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { DateTime } = require('luxon');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');
class ArenaGames {

    constructor() {
        this.proxies = this.loadProxies();
    }

    loadProxies() {
        const proxyFile = path.join(__dirname, 'proxy.txt');
        return fs.readFileSync(proxyFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
    }

    headers(id) {
        return {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "At": `${id}`,
            "Origin": "https://bot-coin.arenavs.com",
            "Priority": "u=1, i",
            "Referer": "https://bot-coin.arenavs.com/",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?1",
            "Sec-Ch-Ua-Platform": '"Android"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
        }
    }

    async getProfile(id, proxy) {
        const url = "https://bot.arenavs.com/v1/profile";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.get(url, { headers, httpsAgent: proxyAgent });
    }

    async getTask(id, proxy) {
        const url = "https://bot.arenavs.com/v1/profile/tasks?page=1&limit=20";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.get(url, { headers, httpsAgent: proxyAgent });
    }

    async doTask(id, taskId, proxy) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}`;
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.post(url, null, { headers, httpsAgent: proxyAgent });
    }

    async claimTask(id, taskId, proxy) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}/claim`;
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.post(url, null, { headers, httpsAgent: proxyAgent });
    }

    async farmCoin(id, proxy) {
        const url = "https://bot.arenavs.com/v1/profile/farm-coin";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.post(url, null, { headers, httpsAgent: proxyAgent });
    }

    async checkRefCoin(id, proxy) {
        const url = "https://bot.arenavs.com/v1/profile/refs/coin";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.get(url, { headers, httpsAgent: proxyAgent });
    }

    async getRefCoin(id, proxy) {
        const url = "https://bot.arenavs.com/v1/profile/get-ref-coin";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.post(url, null, { headers, httpsAgent: proxyAgent });
    }

    async attemptsLeft(id, proxy) {
        const url = "https://bot.arenavs.com/v1/game/attempts-left";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get(url, { headers, httpsAgent: proxyAgent });
        return response;
    }

    async startGame(id, proxy) {
        const url = "https://bot.arenavs.com/v1/game/start";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);
        return axios.post(url, null, { headers, httpsAgent: proxyAgent });
    }

    async stopGame(id, gameData, proxy) {
        const url = "https://bot.arenavs.com/v1/game/stop";
        const headers = this.headers(id);
        const proxyAgent = new HttpsProxyAgent(proxy);

        const payload = {
            xp: gameData.xp,
            height: gameData.height,
            somersault: gameData.somersault,
            time: "60000",
        };

        headers["Content-Length"] = JSON.stringify(payload).length;
        headers["Content-Type"] = "application/json";

        return axios.post(url, payload, { headers, httpsAgent: proxyAgent });
    }

    async playGame(id, proxy) {
        this.log(`${'Starting game...'.yellow}`);
        const startGame = await this.startGame(id, proxy);
        const gameData = {
            xp: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
            height: Math.floor(Math.random() * (35 - 20 + 1)) + 20,
            somersault: Math.floor(Math.random() * (80 - 50 + 1)) + 50,
        };

        try {
            const startStatus = startGame.data.data.status;
            if (startStatus) {
                await this.waitGame(60);
                const stopGame = await this.stopGame(id, gameData, proxy);
                const stopStatus = stopGame.data.data.status;
                if (stopStatus) {
                    this.log(`${'XP earned:'.green} ${gameData.xp}`);
                    this.log(`${'Height:'.green} ${gameData.height}`);
                    this.log(`${'Somersaults:'.green} ${gameData.somersault}`);
                } else {
                    this.log(`${'Error occurred'.red}`);
                    return false;
                }
            } else {
                this.log(`${'Cannot start game'.red}`);
                return false;
            }
        } catch (error) {
            const stopGame = await this.stopGame(id, gameData, proxy);
            const stopStatus = stopGame.data.data.status;
            if (stopStatus) {
                this.log(`${'XP earned:'.green} ${gameData.xp}`);
                this.log(`${'Height:'.green} ${gameData.height}`);
                this.log(`${'Somersaults:'.green} ${gameData.somersault}`);
            } else {
                this.log(`${'Error occurred'.red}`);
                return false;
            }
        }
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Completed all accounts, waiting ${i} seconds to continue the loop =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }
    async waitGame(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[*] Need to wait ${i} seconds to complete`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }
    async checkProxyIP(proxy) {
        try {
            const proxyAgent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpsAgent: proxyAgent
            });
            if (response.status === 200) {
                return response.data.ip;
            } else {
                throw new Error(`Cannot check proxy IP. Status code: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error checking proxy IP: ${error.message}`);
        }
    }

    async main() {

        const dataFile = path.join(__dirname, 'query.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            const endAtList = [];

            for (let no = 0; no < data.length; no++) {
                const id = data[no];
                const proxy = this.proxies[no % this.proxies.length];

                let proxyIP = '';
                try {
                    proxyIP = await this.checkProxyIP(proxy);
                } catch (error) {
                    console.error('Error checking proxy IP:', error);
                }

                try {
                    const getProfile = await this.getProfile(id, proxy);
                    const userName = getProfile.data.data.first_name;
                    const balance = getProfile.data.data.balance.$numberDecimal;
                    const endAt = getProfile.data.data.farmEnd / 1000;
                    const readableTime = DateTime.fromSeconds(endAt).toFormat('yyyy-MM-dd HH:mm:ss');
                    const currentTime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');
                    const endAtObject = DateTime.fromSeconds(endAt);
                    endAtList.push(endAtObject);

                    this.log(`${'Account:'.green} ${userName}`);
                    this.log(`${'Proxy:'.green} ${proxy}`);
                    this.log(`${'IP:'.green} ${proxyIP}`);
                    this.log(`${'Coin balance:'.green} ${balance}`);
                    this.log(`${'Current time:'.green} ${currentTime}`);
                    this.log(`${'Farm end time:'.green} ${readableTime}`);

                    if (endAtObject.diffNow().as('seconds') <= 0) {
                        await this.farmCoin(id, proxy);
                        this.log('=== Successfully received farm coin ==='.green);

                        const checkRefCoin = await this.checkRefCoin(id, proxy);
                        const refCoinBalance = checkRefCoin.data.data.amount;
                        if (refCoinBalance > 0) {
                            await this.getRefCoin(id, proxy);
                            this.log(`${'Received REF coin:'.green} ${refCoinBalance}`);
                        }

                        const taskList = await this.getTask(id, proxy);
                        const tasks = taskList.data.data.docs;

                        for (const task of tasks) {
                            const taskId = task._id;
                            const taskStatus = task.status;

                            if (taskStatus === 'done') {
                                await this.claimTask(id, taskId, proxy);
                                this.log(`Successfully received task with ID ${taskId}`.green);
                            }

                            if (taskStatus === 'received') {
                                await this.doTask(id, taskId, proxy);
                                this.log(`Successfully completed task with ID ${taskId}`.green);
                            }
                        }

                        const response = await this.attemptsLeft(id, proxy);
                        const attemptsLeft = response.data.data.attemptsLeft;

                        if (attemptsLeft > 0) {
                            await this.playGame(id, proxy);
                            this.log(`Game played successfully`.green);
                        } else {
                            this.log(`All game attempts have been used.`.green);
                        }

                        this.log(`===== Account ${userName} has been processed =====`.yellow);
                    }
                } catch (error) {
                    this.log(`${error}`.red);
                }
            }
            let nextFarm
            if(endAtList.length > 0) {
                nextFarm = DateTime.min(...endAtList).plus({ minutes: 5 });
            } else {
                nextFarm = DateTime.utc()
            }
            const sleepDuration = nextFarm.diffNow().as('seconds');
            await this.waitWithCountdown(sleepDuration);
        }
    }
}
const bot = new ArenaGames();
bot.main();
