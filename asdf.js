const axios = require('axios')
const cheerio = require('cheerio')
const log = console.log

const getHtml = async () =>{
    try {
        return await axios.get('https://whatsup.nhnent.com/ne/board/list/1560')
    } catch (error) {
        console.error(error)
    }
}

getHtml().then(html => {
    debugger
    console.log(html)
})