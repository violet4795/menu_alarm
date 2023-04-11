const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const WELFARE_BENEFIT_BOARD_LIST_SELECTOR = '#content > div.board_lst > table > tbody > tr > td.tit > a'
const FOODLIST_DOWNLOAD_BUTTON_SELECTOR = '#lyFileShow > ul > li > a'
// 주간메뉴 페이지 첨부파일 버튼 셀렉터
const ADDFILE_BUTTON_SELECTOR = '.addfile'

let MealList = {
  "date": "",
  "breakfast": "",
  "lunch": "",
  "dinner": "", 
};

async function crawl(){
  // 가상 브라우져를 실행, headless: false를 주면 벌어지는 일을 새로운 창을 열어 보여준다(default: true)
    const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
    });
    const page = await browser.newPage();
    const whatsupId = ''
    const whatsupPw = ''
    
  // headless: false일때 브라우져 크기 지정해주는 코드
    await page.setViewport({
        width: 1366,
        height: 768
    });

    // whatsup 페이지로 
    await page.goto('https://whatsup.nhnent.com/ne/board/list/1560');
    // 로그인
    await page.evaluate((id, pw) => {
        document.querySelector('#username').value = id
        document.querySelector('#password').value = pw
    }, whatsupId, whatsupPw)
    
    await page.click('#login-button')

    // 로그인 후 복리후생 1페이지로
    await page.goto('https://whatsup.nhnent.com/ne/board/list/1560');
    
    // 1페이지 10개 a tag 중 
    const content = await page.content();
    const $ = cheerio.load(content);
    const aList = $(WELFARE_BENEFIT_BOARD_LIST_SELECTOR) // 복리후생 게시판 글 Selector
    
    // 이번주식단 판별
    const thisWeekATag = weekMenuFinder(aList)
    if(thisWeekATag === null) return false

    // 식단 element에게서 selector 추출
    let elementSelector = getElementSelector(thisWeekATag)

    // 화면이동을 클릭이벤트로 이동할것이기 때문에, 화면 로딩을 기다려줄 이벤트 장치 설치
    const navigationPromise = page.waitForNavigation({ waitUntil: 'load' });
    
    // 이번주 식단 글 클릭
    await page.click(elementSelector)
    
    // 뜰때까지 기다림
    await navigationPromise
    await page.screenshot({path:'example.png'})
    
    // 다운로드 경로 설정
    const downloadPath = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }

    // 다운로드 권한 및 경로 설정
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath,
    });


    // 주간메뉴 페이지 첨부파일 버튼클릭
    await page.click(ADDFILE_BUTTON_SELECTOR);
    // 주간식단표 버튼 클릭
    await page.click(FOODLIST_DOWNLOAD_BUTTON_SELECTOR);

    // 파일 다운로드 완료 이벤트 감지
    page._client().on('Page.downloadWillBegin', async (params) => {
        console.log(`download file path: ${path.join(downloadPath, params.suggestedFilename)}`);
    });

    // 엑셀 파일 로드

    // 엑셀 파일에서 데이터 추출

    // 두레이 혹은 카톡으로 전송

    // 

    // await page.click(FOODLIST_DOWNLOAD_BUTTON_SELECTOR);
    // const content2 = await page.content();
    // const $2 = cheerio.load(content2);
    // let x = $2('#lyFileShow')
    // let x = $2('#lyFileShow > ul')
    // $2('#lyFileShow > ul > li > a')[0].attribs.href
    // console.log(x)

    // await page.screenshot({path:'example.png'})


    // #content > div.board_lst > table > tbody > tr:nth-child(3) > td.tit > a
    // console.log(await page.$eval('html > body', element => element.innerHTML))
    // let x = await page.$eval('html > body', element => {
    //     debugger
    //     console.log(element)
    //     // element
    // })

    // 이번주꺼인지 판단
    // 주간메뉴라는 이름을 가진 첫번째놈이면서 날짜값 split해서
    // new Date('04.10')
    
    // await page.click('#content > div.board_lst > table > tbody > tr:nth-child(3) > td.tit > a');


  //해당 페이지에 특정 html 태그를 클릭해라
//   await page.click('body > div > div > div > div > div > div.row > div > div.login-body > div > div.col-xs-12.col-sm-5.login-con.pt20 > div > form > ul > li:nth-child(2)');
  
//   //아이디랑 비밀번호 란에 값을 넣어라
//   await page.evaluate((id, pw) => {
//   document.querySelector('#stuUserId').value = id;
//   document.querySelector('#stuPassword').value = pw;
//   }, ndhs_id, ndhs_pw);

//   //로그인 버튼을 클릭해라
//   await page.click('#student > div > div:nth-child(2) > button');

//   //로그인 화면이 전환될 때까지 기다려라, headless: false 일때는 필요 반대로 headless: true일때는 없어야 되는 코드
//   //await page.waitForNavigation()

//   //로그인 성공 시(화면 전환 성공 시)
//   if(page.url() === 'http://portal.ndhs.or.kr/dashboard/dashboard'){
//       //학사 페이지로 가서
//       await page.goto('http://portal.ndhs.or.kr/studentLifeSupport/carte/list');
      
//       // 현재 페이지의 html정보를 로드
//       const content = await page.content();
//       const $ = cheerio.load(content);
//       const lists = $("body > div.container-fluid > div:nth-child(6) > div > table > tbody > tr");
//       lists.each((index, list) => {
//           MealList[index] = {
//               date: $(list).find("th").text().replace('\n\t\t\t\t\t\t\t\t',""),
//               breakfast:$(list).find("td:nth-of-type(1)").text(),
//               lunch:$(list).find("td:nth-of-type(2)").text(),
//               dinner:$(list).find("td:nth-of-type(3)").text()
//           }
//           console.log(MealList[index]); 

//       })
//   }
//   //로그인 실패시
//   else{
//       console.log('실패');
//       ndhs_id = 'nope';
//       ndhs_pw = 'nope';
//   }

  //브라우저 꺼라
  await browser.close();     
};


// element를 입력받아 Selector를 생성
function getElementSelector(element) {
    const path = [];
    while (element && element.tagName) {
        let selector = element.tagName.toLowerCase();
        if (element.id) {
            selector += '#' + element.id;
            path.unshift(selector);
            break;
        }
        if(element && element.tagName === 'body'){
            path.unshift('body')
            path.unshift('html')
            break;
        }
        if(element && element.attribs.id) {
            selector += '#' + element.attribs.id;
            path.unshift(selector);
            break;
        }
        const siblings = Array.from(element.parentNode.children).filter(e => e.nodeType === 1);
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;

        path.unshift(selector);
        element = element.parent;
    }
    return path.join(' > ');
}


//날짜값 구하기
function weekMenuFinder(aList) {
    const today = new Date()
    let result = null
    const year = today.getFullYear()
    aList.each((index, aTag) => {
        const data = aTag.children[0].data
        if(data.indexOf('주간메뉴') === -1) return // 주간메뉴가 아니면 다음꺼
        const dateRange = data.split('주간메뉴')[1].replaceAll(/[()]/g,'').split('~')
        const firstDate = new Date(`${year}.${dateRange[0]}`) // 04.10 or 4.10
        const lastDate = new Date(`${year}.${dateRange[1]}`)
        if(firstDate <= today && today <= lastDate) result = aTag 

    })
    return result
}

// 배치 실행
const crawlResult = crawl()

// 없다면 ( false )
if(!crawlResult) return ;

// html:nth-child(2) > body:nth-child(3) > div:nth-child(2) > div:nth-child(4) 
// > div:nth-child(14) > div:nth-child(6) > table:nth-child(4) > tbody:nth-child(8) 
// > tr:nth-child(6) > td:nth-child(2) > a:nth-child(2)
 