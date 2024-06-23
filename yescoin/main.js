const axios = require('axios');
const fs = require('fs');


const randomNumber = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
const postData = JSON.stringify(randomNumber);
const postUrl = 'https://api.yescoin.gold/game/collectCoin';
const getUrl = 'https://api.yescoin.gold/account/getAccountInfo';
const getGameInfoUrl = 'https://api.yescoin.gold/game/getGameInfo';
const tokenFilePath = 'query.txt';
let currentIndex = 0;


async function getGameInfoAndLog(headers) {
    try {
        const gameInfoResponse = await axios.get(getGameInfoUrl, { headers });
        if (gameInfoResponse.status === 200) {
            const { coinPoolTotalCount, coinPoolLeftCount } = gameInfoResponse.data.data;
            console.log(`Năng Lượng: ${coinPoolLeftCount}/${coinPoolTotalCount}`);
            return coinPoolLeftCount;
        } else {
            console.error('Nhận thông tin không thành công với mã trạng thái:', gameInfoResponse.status);
            return -1;
        }
    } catch (error) {
        console.error('Lỗi rồi:', error);
        return -1;
    }
}


async function claimForToken(token) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
            'Origin': 'https://www.yescoin.gold',
            'Referer': 'https://www.yescoin.gold/',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Token': token,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        };


        const coinPoolLeftCount = await getGameInfoAndLog(headers);
        if (coinPoolLeftCount < 100) {
            console.log(`Energy nhỏ hơn 100 token ${token.substring(0, 35)}... Claim token tiếp theo`);
            return true; 
        }


        const postResponse = await axios.post(postUrl, postData, { headers });
        if (postResponse.status === 200) {
            const getResponse = await axios.get(getUrl, { headers });
            if (getResponse.status === 200) {
                const { totalAmount, userLevel, rank } = getResponse.data.data;
                console.log(`Claim thành công cho token ${token.substring(0, 35)}...: Balance: ${totalAmount}, User Level: ${userLevel}, Rank: ${rank}`);
            } else {
                console.error(`Nhận Thông tin tài khoản không thành công với mã trạng thái ${getResponse.status}`);
            }
        } else {
            console.error(`Yêu cầu không thành công với mã trạng thái ${postResponse.status}`);
        }

        return false; 
    } catch (error) {
        console.error(`Lỗi rồi:`, error);
        return false; 
    }
}

async function claimAndResetInterval() {
    fs.readFile(tokenFilePath, 'utf8', async (err, data) => {
        if (err) {
            console.error('Lỗi đọc tệp:', err);
            return;
        }
        const tokens = data.split('\n').map(line => line.trim()).filter(line => line !== '');
        if (currentIndex < tokens.length) {
            let shouldSwitchToken = await claimForToken(tokens[currentIndex]);
            if (shouldSwitchToken) {
                currentIndex++; 
            }
        } else {
            console.log('Đã hoàn tất claim tất cả token, nghỉ 20 phút rồi tiếp tục!');
            currentIndex = 0; 
            clearInterval(intervalId);
            setTimeout(() => {
                intervalId = setInterval(claimAndResetInterval, 1000);
            }, 1200000); // nghỉ 20 phút
        }
    });
}


let intervalId = setInterval(claimAndResetInterval, 1000);







