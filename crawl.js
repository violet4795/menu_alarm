const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 엑셀 다운로드 페이지
const DOWNLOAD_PATH = 'downloads'
// 복리후생 페이지 aTag리스트 셀렉터
const WELFARE_BENEFIT_BOARD_LIST_SELECTOR = '#content > div.board_lst > table > tbody > tr > td.tit > a'
// 주간메뉴 버튼 활성화태그 셀렉터
const FOODLIST_DOWNLOAD_BUTTON_SELECTOR = '#lyFileShow > ul > li > a'
// 주간메뉴 페이지 첨부파일 버튼 셀렉터
const ADDFILE_BUTTON_SELECTOR = '.addfile'
// 복리후생 페이지 url
const WELFARE_PAGE_URL = 'https://whatsup.nhnent.com/ne/board/list/1560'

// TODO 로그인 실패 시 처리
async function crawl(whatsupId, whatsupPw) {
    // 가상 브라우져를 실행, headless: false를 주면 벌어지는 일을 새로운 창을 열어 보여준다(default: true)
    // puptteer 세팅 후 시작
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
    await page.goto(WELFARE_PAGE_URL);

    // 로그인
    const isSuccessLogin = await login(page, whatsupId, whatsupPw)

    if (typeof isSuccessLogin === 'string') {
        const err = new Error(isSuccessLogin)
        err.name = 'login-fail'
        await browser.close();
        throw err
    }


    // 로그인 후 복리후생 1페이지로
    await page.goto(WELFARE_PAGE_URL);

    // 1페이지 10개 a tag 중 
    const content = await page.content();
    const $ = cheerio.load(content);
    const aList = $(WELFARE_BENEFIT_BOARD_LIST_SELECTOR) // 복리후생 게시판 글 Selector

    // 이번주식단 판별
    const thisWeekATag = weekMenuFinder(aList)
    if (thisWeekATag === null) {
        const err = new Error('금주 식단 검색에 실패했습니다.')
        err.name = 'search-fail'
        await browser.close();
        throw err
    }

    // 식단 element에게서 selector 추출
    const elementSelector = getElementSelector(thisWeekATag)

    // 화면이동을 클릭이벤트로 이동할것이기 때문에, 화면 로딩을 기다려줄 이벤트 장치 설치
    const navigationPromise = page.waitForNavigation({ waitUntil: 'load' });

    // 이번주 식단 글 클릭
    await page.click(elementSelector)

    // 뜰때까지 기다림
    await navigationPromise

    
    const downloadPath = path.resolve(__dirname, DOWNLOAD_PATH);
    // 다운로드 전에 폴더 비우기
    deleteFilesInFolder(downloadPath);

    // 다운로드 경로 설정
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

function deleteFilesInFolder(folderPath) {
    // 폴더 내의 파일 목록을 가져옵니다.
    const files = fs.readdirSync(folderPath);

    // 각 파일을 삭제합니다.
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        // 파일을 삭제합니다.
        fs.unlinkSync(filePath);
    }
}

async function waitForFileInDirectory(directory) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (files.length > 0) {
                    if (files[0].indexOf('crdownload') === -1) {
                        clearInterval(interval);
                        resolve(files[0]);
                    }
                    // count ++; // TODO 10번정도? 5초 이상 안되면 에러처리 추가
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
        if (element && element.tagName === 'body') {
            path.unshift('body')
            path.unshift('html')
            break;
        }
        if (element && element.attribs.id) {
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

async function login(page, id, pw) {

    // 로그인 실패 
    page.on('dialog', async dialog => {
        const message = dialog.message()
        await dialog.accept();
        return message;
    });

    // 클릭 후에도 sign-in이 url에 남아있다면 실패
    page.on('framenavigated', async (frame) => {
        const successFlag = frame.url().indexOf('sign-in') < 0
        console.log(successFlag)
        if (successFlag) return true
    });

    await page.evaluate((id, pw) => {
        document.querySelector('#username').value = id
        document.querySelector('#password').value = pw
    }, id, pw)
    await page.click('#login-button')

}

//날짜값 구하기
function weekMenuFinder(aList) {
    const today = new Date()
    let result = null
    const year = today.getFullYear()
    aList.each((index, aTag) => {
        const data = aTag.children[0].data
        if (data.indexOf('주간메뉴') === -1) return // 주간메뉴가 아니면 다음꺼
        const dateRange = data.split('주간메뉴')[1].replaceAll(/[()]/g, '').split('~')
        const firstDate = new Date(`${year}.${dateRange[0]}`) // 04.10 or 4.10
        const lastDate = new Date(`${year}.${dateRange[1]} 23:59:59`)
        if (firstDate <= today && today <= lastDate) result = aTag

    })
    return result
}

exports.crawl = crawl