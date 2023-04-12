const { crawl } = require('./crawl')
const { analyzeExcel } = require('./analyzeExcel')
const { sendDoorayMessage } = require('./sendMessage')

const args = process.argv.slice(2);
const [ id, pw, weebHookURL] = args;

main(id, pw, weebHookURL)

// TODO 파일 다운로드 complete
// TODO 파일 분석 complete
// TODO 두레이 전송 complete
// TODO 배치 추가 
// TODO 매일 할일과 매주 한번 할일 분리 후 구현
// TODO console.log to logging

async function main(id, pw, weebHookURL){
    // 배치 실행
    let crawlResult = null
    try{
        crawlResult = await crawl(id, pw)
    } catch(e){
    }

    // 없다면 ( false )
    if(!crawlResult) return ;

    const weekMenu = analyzeExcel(crawlResult)
    
    let meal = '점심'
    let todayMenu = mealFilter(weekMenu, meal)

    let textTodayMenu = menuToText(todayMenu)
    
    //if 점심일때
    sendDoorayMessage(textTodayMenu, weebHookURL)

    //if 저녁일때
    // sendDoorayMessage(weekMenu, '저녁')


    // 엑셀 파일 데이터 추출
    // console.log(crawlResult)
    // console.log(weekMenu)

}

function menuToText(menu) {
    return menu.reduce((prev, curr) => {
        return prev += `${curr.course}: ${curr.menu} \n`
    }, '')
}

function mealFilter(weekMenu, meal) {
    const today = getDayOfWeek(new Date())
    return weekMenu.filter(e => e.day === today && e.meal === meal)
}

function getDayOfWeek(date) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
}