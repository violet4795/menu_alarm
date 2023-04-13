const Util = {}

Util.getDayOfWeek = (date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
}

function isNear(targetHour, currentHour, range) {
    return Math.abs(targetHour - currentHour) <= range;
}

Util.getMealTimeText = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const lunchHour = 12;
    const dinnerHour = 18;
    const range = 2; // 시간이 몇 시간 이내에 있는지 확인할 범위입니다.

    if (isNear(lunchHour, currentHour, range)) {
        return '점심';
    } else if (isNear(dinnerHour, currentHour, range)) {
        return '저녁';
    } else {
        return '시간에 가까운 식사가 없습니다.';
    }
}

Util.menuToText = (menu) => {
    return menu.reduce((prev, curr) => {
        return prev += `${curr.course}: ${curr.menu} \n`
    }, '')
}

Util.mealFilter = (weekMenu, meal) => {
    const today = Util.getDayOfWeek(new Date())
    return weekMenu.filter(e => e.day === today && e.meal === meal)
}

module.exports = Util