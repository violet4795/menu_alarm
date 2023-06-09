const { crawl } = require('./crawl')
const { analyzeExcel } = require('./analyzeExcel')
const { sendDoorayMessage } = require('./sendMessage')
const cron = require('node-cron');
const Util = require('./util.js')
const readline = require('readline');

const args = process.argv.slice(2);
const [weebHookURL] = args;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

rl.question('Whats up ID를 입력하세요: ', (id) => {
    maskedInput('Whats up PW를 입력하세요: ', (pw) => {
        console.log('\n')
        main(id, pw, weebHookURL)
        rl.close();
    });
});


function maskedInput(prompt, callback) {
    rl.stdoutMuted = true;

    // 비밀번호 입력 시 *로 마스킹 처리
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (rl.stdoutMuted) {
            rl.output.write('\x1B[2K\x1B[200D' + prompt + '*'.repeat(rl.line.length));
        } else {
            rl.output.write(stringToWrite);
        }
    };

    rl.question(prompt, function (input) {
        rl.close();
        callback(input);
    });
}

// TODO 파일 다운로드 done
// TODO 파일 분석 done
// TODO 두레이 전송 done
// TODO 배치 추가 done
// TODO 매일 할일과 매주 한번 할일 분리 후 구현 
// TODO console.log to logging


async function main(id, pw, weebHookURL) {
    // 배치 실행
    let crawlResult = null
    try {
        crawlResult = await crawl(id, pw) 
    } catch (e) {
        if(e.name === 'login-fail') {
            console.error(e.message)
            return;
        }
        if(e.name === 'search-fail') {
            console.error(e.message)
            return;
        }
        console.error(e)
    }
    const weekMenu = analyzeExcel(crawlResult)

    // 프로세스 종료 시 스케쥴러도 죽도록
    process.on('SIGINT', () => {
        console.log('Terminating scheduledJob...');
        scheduledJobSendMail.stop();
        process.exit();
    });

    process.on('SIGTERM', () => {
        console.log('Terminating scheduledJob...');
        scheduledJobSendMail.stop();
        process.exit();
    });

    // 월-금 오전 11시 30분에 작업을 실행합니다.
    const scheduledJobSendMail = cron.schedule('30 11 * * 1-5', () => {
        const meal = Util.getMealTimeText() // 점심 or 저녁
        const todayMenu = Util.mealFilter(weekMenu, meal)
        const textTodayMenu = Util.menuToText(todayMenu)

        sendDoorayMessage(textTodayMenu, weebHookURL)
    });

}
