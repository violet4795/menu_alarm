const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_PATH = 'downloads'
// 복리후생 페이지 aTag리스트 셀렉터
const WELFARE_BENEFIT_BOARD_LIST_SELECTOR = '#content > div.board_lst > table > tbody > tr > td.tit > a'
// 주간메뉴 버튼 활성화태그 셀렉터
const FOODLIST_DOWNLOAD_BUTTON_SELECTOR = '#lyFileShow > ul > li > a'
// 주간메뉴 페이지 첨부파일 버튼 셀렉터
const ADDFILE_BUTTON_SELECTOR = '.addfile'

// TODO 로그인 실패 시 처리
async function crawl(whatsupId, whatsupPw){
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
    if(thisWeekATag === null) return null

    // 식단 element에게서 selector 추출
    let elementSelector = getElementSelector(thisWeekATag)

    // 화면이동을 클릭이벤트로 이동할것이기 때문에, 화면 로딩을 기다려줄 이벤트 장치 설치
    const navigationPromise = page.waitForNavigation({ waitUntil: 'load' });
    
    // 이번주 식단 글 클릭
    await page.click(elementSelector)
    
    // 뜰때까지 기다림
    await navigationPromise
    
    // 다운로드 경로 설정
    const downloadPath = path.resolve(__dirname, DOWNLOAD_PATH);
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

    // 주간메뉴 엑셀 다운로드
    await page.click(FOODLIST_DOWNLOAD_BUTTON_SELECTOR);
    
    // 파일 생성 대기
    const filename = await waitForFileInDirectory(downloadPath);
    const filePath = path.join(downloadPath, filename);

    console.log(`Downloaded file path: ${filePath}`);

    await browser.close();
    return { filePath, filename };

};

async function waitForFileInDirectory(directory) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            if (files.length > 0) {
                clearInterval(interval);
                resolve(files[0]);
            }
            });
        }, 500);
    });
}

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

exports.crawl = crawl