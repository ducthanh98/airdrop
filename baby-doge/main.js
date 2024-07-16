const {HttpsProxyAgent} = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const {performance} = require('perf_hooks');

class BabyDoge {
    constructor() {
        this.headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://babydogepawsbot.com',
            'Referer': 'https://babydogepawsbot.com/',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        };
        this.line = '~'.repeat(42).white;
    }

    async http(url, headers, data = null, proxy = null) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const options = {headers};
                if (proxy) {
                    options.httpsAgent = new HttpsProxyAgent(proxy);
                }
                let res;
                if (data === null) {
                    res = await axios.get(url, options);
                } else {
                    res = await axios.post(url, data, options);
                }
                if (typeof res.data !== 'object') {
                    this.log('Did not receive valid JSON response!'.red);
                    attempts++;
                    await this.sleep(2000);
                    continue;
                }
                return res;
            } catch (error) {
                attempts++;
                this.log(`Connection error (Attempt ${attempts}/${maxAttempts}): ${error.message}`.red);
                console.log(error);
                if (attempts < maxAttempts) {
                    await this.sleep(5000);
                } else {
                    break;
                }
            }
        }
        throw new Error('Unable to connect after 3 attempts');
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
                throw new Error(`Unable to check proxy IP. Status code: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error checking proxy IP: ${error.message}`);
        }
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async dangnhap(tgData, proxy) {
        const url = 'https://backend.babydogepawsbot.com/authorize';
        const headers = {...this.headers};
        try {
            const res = await this.http(url, headers, tgData, proxy);
            if (res.data) {
                this.log('Login successful!'.green);
                const {balance, energy, max_energy, access_token} = res.data;
                this.log('Balance:'.green + ` ${balance}`);
                this.log('Energy:'.green + ` ${energy}/${max_energy}`);
                return {access_token, energy};
            } else {
                this.log('Login failed!'.red);
                return null;
            }
        } catch (error) {
            this.log(`Error: ${error.message}`.red);
            return null;
        }
    }

    async daily(access_token, proxy) {
        const checkUrl = 'https://backend.babydogepawsbot.com/getDailyBonuses';
        const claimUrl = 'https://backend.babydogepawsbot.com/pickDailyBonus';
        const headers = {...this.headers, 'X-Api-Key': access_token};

        try {
            const checkRes = await this.http(checkUrl, headers, null, proxy);
            if (checkRes.data && checkRes.data.has_available) {
                this.log('Daily check-in available!'.yellow);
                const claimRes = await this.http(claimUrl, headers, '', proxy);
                if (claimRes.data) {
                    this.log('Daily check-in successful!'.green);
                } else {
                    this.log('Daily check-in failed!'.red);
                }
            } else {
                this.log('Already checked in today.'.yellow);
            }
        } catch (error) {
            this.log(`Error checking or claiming daily bonus: ${error.message}`.red);
        }
    }

    async getTask(access_token, proxy) {
        const url = 'https://backend.babydogepawsbot.com/channels';
        const headers = {...this.headers, 'X-Api-Key': access_token};

        try {
            const res = await this.http(url, headers, null, proxy);
            if (res && res.data && res.data.channels) {
                const availableChannels = res.data.channels.filter(channel => channel.is_available && channel.type !== 'telegram');
                return availableChannels;
            } else {
                this.log('No tasks available.'.yellow);
                return [];
            }
        } catch (error) {
            this.log(`Error: ${error.message}`.red);
            return [];
        }
    }

    async claimTask(access_token, channel, proxy) {
        const url = 'https://backend.babydogepawsbot.com/channels';
        const headers = {...this.headers, 'X-Api-Key': access_token, 'Content-Type': 'application/json'};
        const data = JSON.stringify({channel_id: channel.id});

        try {
            const res = await this.http(url, headers, data, proxy);
            if (res && res.data) {
                this.log(`Claiming task: ${channel.title.yellow}... Status: success`);
            } else {
                this.log(`Error claiming reward for task: ${channel.title}`.red);
            }
        } catch (error) {
            this.log(`Error claiming reward: ${error.message}`.red);
        }
    }

    async tapdc(access_token, initialEnergy, proxy) {
        const url = 'https://backend.babydogepawsbot.com/mine';
        const headers = {...this.headers, 'X-Api-Key': access_token, 'Content-Type': 'application/json'};
        let energy = initialEnergy;
        try {
            while (energy >= 50) {
                const count = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
                const data = JSON.stringify({count});

                const res = await this.http(url, headers, data, proxy);
                if (res.data) {
                    const {balance, mined, newEnergy, league, current_league, next_league} = res.data;

                    this.log(`Tapped ${String(mined).yellow} times. Balance: ${String(balance).yellow} Energy: ${String(newEnergy).yellow}`);

                    energy = newEnergy;

                    if (energy < 30) {
                        this.log('Energy too low to continue tapping... switching accounts!'.yellow);
                        break;
                    }
                    await this.sleep(500)
                } else {
                    this.log('Error, unable to tap!'.red);
                    break;
                }
            }
        } catch (error) {
            this.log(`Error: ${error.message}`.red);
        }
    }

    async buyCards(access_token, proxy) {
        const listCardsUrl = 'https://backend.babydogepawsbot.com/cards/new';
        const upgradeUrl = 'https://backend.babydogepawsbot.com/cards';
        const getMeUrl = 'https://backend.babydogepawsbot.com/getMe';
        const headers = {...this.headers, 'X-Api-Key': access_token, 'Content-Type': 'application/json'};

        try {
            const getMeRes = await this.http(getMeUrl, headers, null, proxy);
            let balance = getMeRes.data.balance;

            const res = await this.http(listCardsUrl, headers, null, proxy);
            if (res.data && res.data.length > 0) {
                const cards = res.data;
                for (const card of cards) {
                    if (balance < card.upgrade_cost) {
                        this.log(`Not enough balance to buy card!`.red);
                        return;
                    }

                    if (card.cur_level === 0) {
                        const upgradeData = JSON.stringify({id: card.id});
                        const upgradeRes = await this.http(upgradeUrl, headers, upgradeData, proxy);
                        if (upgradeRes.data) {
                            balance = upgradeRes.data.balance;
                            this.log(`Buying card ${card.name.yellow}... Status: ${'Success'.green} New balance: ${String(balance).yellow}`);
                        } else {
                            this.log(`Buying card ${card.name.yellow}... Status: ${'Failed'.red}`);
                        }
                    }
                }
            } else {
                this.log('No new cards available.'.yellow);
            }
        } catch (error) {
            this.log(`Error: ${error.message}`.red);
        }
    }

    async processAccounts() {
        const input = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const accountsPath = path.join(__dirname, 'query.txt');
        const proxyPath = path.join(__dirname, 'proxy.txt');
        if (!fs.existsSync(accountsPath)) {
            this.log('File query.txt does not exist!'.red);
            input.close();
            return;
        }

        const accounts = fs.readFileSync(accountsPath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const proxies = fs.readFileSync(proxyPath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

        for (let i = 0; i < accounts.length; i++) {
            const acc = accounts[i];
            const proxyUrl = proxies[i % proxies.length]

            const proxyIP = await this.checkProxyIP(proxyUrl);
            this.log(`Proxy IP checked: ${proxyIP}`.cyan);
            const loginResult = await this.dangnhap(acc, proxyUrl);
            if (loginResult) {
                const {access_token, energy} = loginResult;
                await this.daily(access_token, proxyUrl);
                const channels = await this.getTask(access_token, proxyUrl);
                for (const channel of channels) {
                    await this.claimTask(access_token, channel, proxyUrl);
                }
                await this.tapdc(access_token, energy, proxyUrl);
                await this.buyCards(access_token, proxyUrl);
            }
            this.log(this.line);
            await this.sleep(5000);
        }
        this.log('All accounts processed!'.green);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const bot = new BabyDoge();
bot.processAccounts();
