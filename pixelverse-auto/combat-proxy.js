const WebSocket = require('ws');
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const { randomInt } = require('crypto');
const { HttpsProxyAgent } = require('https-proxy-agent');
const axios = require('axios');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

let urlproxy = config.proxy;
class Battle {
    constructor() {
        this.url = 'https://api-clicker.pixelverse.xyz/api/users';
        this.secret = config.secret;
        this.tgId = config.tgId;
        this.initData = config.initData;
        this.websocket = null;
        this.battleId = "";
        this.superHit = false;
        this.strike = {
            defense: false,
            attack: false
        };
        this.stop_event = false;
        this.rateLimitDelay = 1000;

        const proxyUrl = urlproxy;
        this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    }

    async sendHit() {
        while (!this.stop_event) {
            if (this.superHit) {
                await setTimeout(130);
                continue;
            }

            const content = [
                "HIT",
                {
                    battleId: this.battleId
                }
            ];
            try {
                this.websocket.send(`42${JSON.stringify(content)}`);
            } catch {
                return;
            }
            await setTimeout(130);
        }
    }

    async listenerMsg() {
        while (!this.stop_event) {
            try {
                const data = await new Promise((resolve, reject) => {
                    this.websocket.once('message', resolve);
                    this.websocket.once('error', reject);
                });

                const message = data.toString();

                if (message.startsWith('42')) {
                    const parsedData = JSON.parse(message.slice(2));
                    if (parsedData[0] === "HIT") {
                        process.stdout.write(`\r[ Fight ]: ${this.player1.name} (${parsedData[1].player1.energy}) - (${parsedData[1].player2.energy}) ${this.player2.name}`);
                    } else if (parsedData[0] === "SET_SUPER_HIT_PREPARE") {
                        this.superHit = true;
                    } else if (parsedData[0] === "SET_SUPER_HIT_ATTACK_ZONE") {
                        const content = [
                            "SET_SUPER_HIT_ATTACK_ZONE",
                            {
                                battleId: this.battleId,
                                zone: randomInt(1, 5)
                            }
                        ];
                        this.websocket.send(`42${JSON.stringify(content)}`);
                        this.strike.attack = true;
                    } else if (parsedData[0] === "SET_SUPER_HIT_DEFEND_ZONE") {
                        const content = [
                            "SET_SUPER_HIT_DEFEND_ZONE",
                            {
                                battleId: this.battleId,
                                zone: randomInt(1, 5)
                            }
                        ];
                        this.websocket.send(`42${JSON.stringify(content)}`);
                        this.strike.defense = true;
                    } else if (parsedData[0] === "SUPER_HIT_ROUND_RESULT") {
                        this.superHit = false;
                        this.strike = { defense: false, attack: false };
                    } else if (parsedData[0] === "ERROR" && parsedData[1].error === 'Not so fast! To many requests') {
                        console.log('  Đấm nhanh quá, đang giảm tốc độ một chút...');
                        await setTimeout(this.rateLimitDelay);
                    } else if (parsedData[0] === "ENEMY_LEAVED") {
                    } else if (parsedData[0] === "END") {
                        await setTimeout(1000);
                        console.log('');
                        if (parsedData[1].result === "WIN") {
                            console.log(`[ Fight ]: [ Result ] ${parsedData[1].result} | [ Reward ] ${parsedData[1].reward} Coins`);
                        } else {
                            console.log(`[ Fight ]: [ Result ] ${parsedData[1].result} | [ Reward ] ${parsedData[1].reward} Coins`);
                        }

                        await new Promise((resolve) => this.websocket.once('message', resolve));
                        this.stop_event = true;
                        return;
                    }

                    try {
                        if ((this.strike.attack && !this.strike.defense) || (this.strike.defense && !this.strike.attack)) {
                            await new Promise((resolve) => this.websocket.once('message', resolve));
                            await new Promise((resolve) => this.websocket.once('message', resolve));
                        }
                        if (this.strike.attack && this.strike.defense) {
                            await new Promise((resolve) => this.websocket.once('message', resolve));
                            this.websocket.send("3");
                            await new Promise((resolve) => this.websocket.once('message', resolve));
                            this.superHit = false;
                        }
                    } catch {
                    }
                }
            } catch (err) {
                console.error('Lỗi:', err);
                this.stop_event = true;
                return;
            }
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            const uri = "wss://api-clicker.pixelverse.xyz/socket.io/?EIO=4&transport=websocket";
            const websocket = new WebSocket(uri, { agent: this.proxyAgent }); 
            websocket.setMaxListeners(0);

            websocket.on('open', async () => {
                this.websocket = websocket;
                await new Promise((resolve) => websocket.once('message', resolve));
                const content = {
                    "tg-id": this.tgId,
                    "secret": this.secret,
                    "initData": this.initData
                };

                websocket.send(`40${JSON.stringify(content)}`);
                await new Promise((resolve) => websocket.once('message', resolve));

                const data = await new Promise((resolve) => websocket.once('message', resolve));
                const parsedData = JSON.parse(data.toString().slice(2)); 
                this.battleId = parsedData[1].battleId;
                this.player1 = {
                    name: parsedData[1].player1.username
                };
                this.player2 = {
                    name: parsedData[1].player2.username
                };

                console.log(`[ Fight ] : Trận chiến giữa ${parsedData[1].player1.username} - ${parsedData[1].player2.username}`);

                for (let i = 5; i > 0; i--) {
                    console.log(`[ Fight ]: Trận đấu bắt đầu sau ${i} giây`);
                    await setTimeout(1000);
                }

                console.log('');

                const listenerMsgTask = this.listenerMsg();
                const hitTask = this.sendHit();

                await Promise.all([listenerMsgTask, hitTask]);

                console.log('');
                resolve();
            });

            websocket.on('error', (err) => {
                console.error('WebSocket error:', err);
                reject(err);
            });

            websocket.on('close', (code, reason) => {
                console.log(`  WebSocket được đóng: ${code}, lý do: ${reason}`);
                this.stop_event = true;
                if (code === 1000 || code === 1005) {
                    resolve();
                } else {
                    reject(new Error(`  WebSocket được đóng: ${code}, lý do: ${reason}`));
                }
            });
        });
    }
}

const checkProxyIP = async (proxy) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent
        });
        if (response.status === 200) {
            console.log('\nĐịa chỉ IP của proxy là:', response.data.ip);
        } else {
            console.error('Không thể kiểm tra IP của proxy. Status code:', response.status);
        }
    } catch (error) {
        console.error('Error khi kiểm tra IP của proxy:', error);
    }
};


const startNewBattle = async () => {
    const battle = new Battle();
    await battle.connect();
};

const battleLoop = async () => {
    while (true) {
        console.log('\n-----------------------------------');
        console.log('Bắt đầu trận chiến mới...');

        const proxy = urlproxy;
        const progress = {
            update: (status) => console.log(status.status)
        };
        await checkProxyIP(proxy, progress);

        try {
            await startNewBattle();
            console.log('Trận chiến kết thúc. Bắt đầu trận chiến mới sau 5 giây...');
        } catch (err) {
            console.error('Lỗi trong trận chiến:', err);
            console.log('Thử lại sau 5 giây...');
        }
        await setTimeout(5000);
    }
};

battleLoop();