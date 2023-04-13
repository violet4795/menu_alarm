const XLSX = require('xlsx');

function analyzeExcel({filePath, fileName}) {
    const workbook = XLSX.readFile(filePath)
    const targetSheetName = '칼로리및알레르기공시'
    // const downloadPath = path.resolve(__dirname, DOWNLOAD_PATH);
    
    let targetWorksheet = null;
    for (const sheetName of workbook.SheetNames) {
        if(sheetName === targetSheetName) {
            targetWorksheet = workbook.Sheets[sheetName];
            break;
        }
    }

    let data = null

    if(!targetWorksheet){
        console.log(`워크시트 "${targetSheetName}"이(가) 엑셀 파일에 없습니다.`);
        return false;
    }

    // merge 된 데이터 해제하고 채워넣는 작업
    unMergeAndFill(targetWorksheet)

    // 워크시트를 JSON으로 변환
    data = XLSX.utils.sheet_to_json(targetWorksheet);

    // 행에 '월'이 발견되면 기준 행으로 삼는다.
    const rowDayIndex = data.findIndex(row => Object.values(row).find(f => f === '월'))
    if(rowDayIndex === -1) return false // 에러 
    const baseRow = data[rowDayIndex]
    const baseRowEntries = Object.entries(baseRow)
    const mealAttr = baseRowEntries.find(e => e[1] === '구분')[0]
    const courseAttr = baseRowEntries.find(e => e[1] === '코스')[0]
    const attrToWeek = {
        [baseRowEntries.find(e => e[1] === '월')[0]]: '월',
        [baseRowEntries.find(e => e[1] === '화')[0]]: '화',
        [baseRowEntries.find(e => e[1] === '수')[0]]: '수',
        [baseRowEntries.find(e => e[1] === '목')[0]]: '목',
        [baseRowEntries.find(e => e[1] === '금')[0]]: '금',
    }
    const monAttr = baseRowEntries.find(e => e[1] === '월')[0]
    const tueAttr = baseRowEntries.find(e => e[1] === '화')[0]
    const wenAttr = baseRowEntries.find(e => e[1] === '수')[0]
    const thuAttr = baseRowEntries.find(e => e[1] === '목')[0]
    const friAttr = baseRowEntries.find(e => e[1] === '금')[0]

    const sortedData = [];
    [monAttr, tueAttr, wenAttr, thuAttr, friAttr].forEach(dayColumn => {
        // 각 요일에 해당하는 점심 데이터를 찾아서 정렬된 배열에 추가합니다.
        data.filter(row => row[dayColumn] && row[mealAttr] === "점심").forEach(lunchRow => {
            let findData = sortedData.find(e => 
                e.day == attrToWeek[dayColumn] &&
                e.meal == lunchRow[mealAttr] &&
                e.course == lunchRow[courseAttr] 
            )
            if(findData) {
                findData.menu += ', ' + lunchRow[dayColumn]
            }else{
                sortedData.push({
                    day: attrToWeek[dayColumn],
                    meal: lunchRow[mealAttr],
                    course: lunchRow[courseAttr],
                    menu: lunchRow[dayColumn]
                });
            }
        });

        // 각 요일에 해당하는 저녁 데이터를 찾아서 정렬된 배열에 추가합니다.
        data.filter(row => row[dayColumn] && row[mealAttr] === "저녁").forEach(lunchRow => {
            let findData = sortedData.find(e => 
                e.day == attrToWeek[dayColumn] &&
                e.meal == lunchRow[mealAttr] &&
                e.course == lunchRow[courseAttr] 
            )
            if(findData) {
                findData.menu += ', ' + lunchRow[dayColumn]
            }else{
                sortedData.push({
                    day: attrToWeek[dayColumn],
                    meal: lunchRow[mealAttr],
                    course: lunchRow[courseAttr],
                    menu: lunchRow[dayColumn]
                });
            }
            
        });
    });

    return sortedData;
}

/**
 * 데이터 처리를 위해 셀 병합 정보 해제 후 데이터 채워넣기
*/ 
function unMergeAndFill(targetWorksheet){
    const merges = targetWorksheet['!merges']
    
    if (merges) {
        merges.forEach(merge => {
            const startRow = merge.s.r;
            const endRow = merge.e.r;
            const startCol = merge.s.c;
            const endCol = merge.e.c;
                
            let x = targetWorksheet[XLSX.utils.encode_cell({ r: startRow, c: startCol })]
            const value = x ? x.v : 0;
        
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    targetWorksheet[XLSX.utils.encode_cell({ r: row, c: col })] = { t: 's', v: value };
                }
            }
        });
    }
}

exports.analyzeExcel = analyzeExcel