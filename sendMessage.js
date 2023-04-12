
const axios = require('axios')
const Util = require('./util')

const data = {
    botName: '',
    botIconImage: 'https://static.dooray.com/static_images/dooray-bot.png',
    text: ''
}

function sendDoorayMessage(todayMenu, webHookURL) {
    data.text = todayMenu
    data.botName = `${Util.getDayOfWeek(new Date())}요일 ${Util.getMealTimeText()} 메뉴`
    axios.post(webHookURL, data, {
        headers: {
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        console.log(`웹훅 전송 성공: ${response.status}`);
    }).catch((error) => {
        console.error(`웹훅 전송 실패: ${error.message}`);
    });
}

exports.sendDoorayMessage = sendDoorayMessage