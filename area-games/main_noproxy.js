const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { DateTime } = require('luxon');
const readline = require('readline');
const colors = require('colors');

class ArenaGames {

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

    async getProfile(id) {
        const url = "https://bot.arenavs.com/v1/profile";
        const headers = this.headers(id);
        return axios.get(url, { headers });
    }

    async getTask(id) {
        const url = "https://bot.arenavs.com/v1/profile/tasks?page=1&limit=20";
        const headers = this.headers(id);
        return axios.get(url, { headers });
    }

    async doTask(id, taskId) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}`;
        const headers = this.headers(id);
        return axios.post(url, null, { headers });
    }

    async claimTask(id, taskId) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}/claim`;
        const headers = this.headers(id);
        return axios.post(url, null, { headers });
    }

    async farmCoin(id) {
        const url = "https://bot.arenavs.com/v1/profile/farm-coin";
        const headers = this.headers(id);
        return axios.post(url, null, { headers });
    }

    async checkRefCoin(id) {
        const url = "https://bot.arenavs.com/v1/profile/refs/coin";
        const headers = this.headers(id);
        return axios.get(url, { headers });
    }

    async getRefCoin(id) {
        const url = "https://bot.arenavs.com/v1/profile/get-ref-coin";
        const headers = this.headers(id);
        return axios.post(url, null, { headers });
    }

    async attemptsLeft(id) {
        const url = "https://bot.arenavs.com/v1/game/attempts-left";
        const headers = this.headers(id);
        const response = await axios.get(url, { headers });
        return response;
    }

    async startGame(id) {
        const url = "https://bot.arenavs.com/v1/game/start";
        const headers = this.headers(id);
        return axios.post(url, null, { headers });
    }

    async stopGame(id, gameData) {
        const url = "https://bot.arenavs.com/v1/game/stop";
        const headers = this.headers(id);

        const payload = {
            xp: gameData.xp,
            height: gameData.height,
            somersault: gameData.somersault,
            time: "60000",
        };

        headers["Content-Length"] = JSON.stringify(payload).length;
        headers["Content-Type"] = "application/json";

        return axios.post(url, payload, { headers });
    }

    async playGame(id) {
        this.log(`${'Starting game...'.yellow}`);
        const startGame = await this.startGame(id);
        const gameData = {
            xp: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
            height: Math.floor(Math.random() * (35 - 20 + 1)) + 20,
            somersault: Math.floor(Math.random() * (80 - 50 + 1)) + 50,
        };

        try {
            const startStatus = startGame.data.data.status;
            if (startStatus) {
                await this.waitGame(60);
                const stopGame = await this.stopGame(id, gameData);
                const stopStatus = stopGame.data.data.status;
                if (stopStatus) {
                    this.log(`${'XP earned:'.green} ${gameData.xp}`);
                    this.log(`${'Height:'.green} ${gameData.height}`);
                    this.log(`${'Somersault:'.green} ${gameData.somersault}`);
                } else {
                    this.log(`${'Error'.red}`);
                    return false;
                }
            } else {
                this.log(`${'Cannot start game'.red}`);
                return false;
            }
        } catch (error) {
            const stopGame = await this.stopGame(id, gameData);
            const stopStatus = stopGame.data.data.status;
            if (stopStatus) {
                this.log(`${'XP earned:'.green} ${gameData.xp}`);
                this.log(`${'Height:'.green} ${gameData.height}`);
                this.log(`${'Somersault:'.green} ${gameData.somersault}`);
            } else {
                this.log(`${'Error'.red}`);
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
            process.stdout.write(`===== Completed all accounts, waiting ${i} seconds to continue loop =====`);
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
    async main() {

        const dataFile = path.join(__dirname, 'id.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            const endAtList = [];

            for (let no = 0; no < data.length; no++) {
                const id = data[no];

                try {
                    const getProfile = await this.getProfile(id);
                    const userName = getProfile.data.data.first_name;
                    const balance = getProfile.data.data.balance.$numberDecimal;
                    const endAt = getProfile.data.data.farmEnd / 1000;
                    const readableTime = DateTime.fromSeconds(endAt).toFormat('yyyy-MM-dd HH:mm:ss');
                    console.log(`========== Account ${no + 1} | ${userName.green} ==========`);
                    this.log(`${'Balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
                    this.log(`${'Farm completion time:'.green} ${readableTime.white}`);
                    endAtList.push(endAt);
                } catch (error) {
                    this.log(`${'User information error'.red}`);
                    console.log(error);
                }

                try {
                    const getTask = await this.getTask(id);
                    const tasks = getTask.data.data.docs;
                    const taskInfo = tasks.map(task => ({
                        task_id: task._id,
                        task_name: task.title,
                        task_status: task.status
                    }));

                    const pendingTasks = taskInfo.filter(task => task.task_status === 'pending');
                    if (pendingTasks.length > 0) {
                        for (const task of pendingTasks) {
                            const result = (await this.doTask(id, task.task_id)).data.data.status;
                            this.log(`${task.task_name.white}: ${'Doing task...'.yellow} ${'Status:'.white} ${result.yellow}`);
                        }
                    }

                    const completedTasks = taskInfo.filter(task => task.task_status === 'completed');
                    if (completedTasks.length > 0) {
                        for (const task of completedTasks) {
                            const result = (await this.claimTask(id, task.task_id)).data.data.status;
                            this.log(`${task.task_name.white}: ${'Task completed...'.yellow} ${'Status:'.white} ${result.yellow}`);
                        }
                    }

                    const claimTasks = taskInfo.filter(task => task.task_status === 'claim');
                    if (claimTasks.length > 0) {
                        for (const task of claimTasks) {
                            this.log(`${task.task_name.white}: ${'Completed'.green}`);
                        }
                    }
                } catch (error) {
                    this.log(`${'Error claiming task'.red}`);
                }

                try {
                    this.log(`${'Starting farm...'.yellow}`);
                    const farmCoin = await this.farmCoin(id);
                    if (farmCoin.data.statusCode === 400) {
                        this.log(`${'Already farming'.yellow}`);
                    } else if (farmCoin.data.status === 'ok') {
                        this.log(`${'Farm successful'.yellow}`);
                    }

                    const getProfile = await this.getProfile(id);
                    const balance = getProfile.data.data.balance.$numberDecimal;
                    this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
                } catch (error) {
                    this.log(`${'Not time yet'.red}`);
                }

                try {
                    const checkRefCoin = await this.checkRefCoin(id);
                    const refCoin = checkRefCoin.data.data.allCoin.$numberDecimal;
                    if (parseInt(refCoin) > 0) {
                        this.log(`${'Received'.yellow} ${parseInt(refCoin)} ${'XP from friends...'.yellow}`);
                        const getRefCoin = await this.getRefCoin(id);
                        const balance = getRefCoin.data.data.balance.$numberDecimal;
                        this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
                    }
                } catch (error) {
                    this.log(`${'Error checking XP from friends'.red}`);
                }

                try {
                    while (true) {
                        const attemptsLeft = await this.attemptsLeft(id);
                        const gameLeft = attemptsLeft.data.data.quantity;
                        this.log(`${'Game tickets:'.green} ${gameLeft}`);
                        if (parseInt(gameLeft) > 0) {
                            await this.playGame(id);
                            const getProfile = await this.getProfile(id);
                            const balance = getProfile.data.data.balance.$numberDecimal;
                            this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
                        } else {
                            this.log(`${'No more game tickets'.yellow}`);
                            break;
                        }
                    }
                } catch (error) {
                    this.log(`${'Error playing game'.red}`);
                }
            }

            let waitTime;
            if (endAtList.length > 0) {
                const now = DateTime.now().toSeconds();
                const waitTimes = endAtList.map(endAt => endAt - now).filter(waitTime => waitTime > 0);
                if (waitTimes.length > 0) {
                    waitTime = Math.min(...waitTimes);
                } else {
                    waitTime = 15 * 60;
                }
            } else {
                waitTime = 15 * 60;
            }
            await this.waitWithCountdown(Math.floor(waitTime));
        }
    }
}

if (require.main === module) {
    const arena = new ArenaGames();
    arena.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
