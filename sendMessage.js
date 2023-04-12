
const axios = require('axios')

const data = {
    botName: 'menu_alert',
    botIconImage: 'https://static.dooray.com/static_images/dooray-bot.png',
    text: ''
}

function sendDoorayMessage(todayMenu, webHookURL){
    data.text = todayMenu
    
    axios.post(webHookURL, data, {
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then((response) => {
        console.log(`웹훅 전송 성공: ${response.status}`);
    })
    .catch((error) => {
        console.error(`웹훅 전송 실패: ${error.message}`);
    });

}


  

exports.sendDoorayMessage = sendDoorayMessage