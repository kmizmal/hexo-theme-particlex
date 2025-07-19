// 鼠标点击特效
let quotes = [
    "去活出你自己。", "今天的好计划胜过明天的完美计划。",
    "不要轻言放弃，否则对不起自己。", "紧要关头不放弃，绝望就会变成希望。",
    "如果不能改变结果，那就完善过程。", "好好活就是干有意义的事，有意义的事就是好好活！",
    "桃李春风一杯酒，江湖夜雨十年灯。", "欲买桂花同载酒，终不似，少年游。"
];

$("body").click(function (e) {
    if ($(e.target).is("img")) return;
    if ($(e.target).closest("pre").length > 0) return;
    // 随机选择语录
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    const $quoteElement = $("<span class='quote'></span>")
        .text(quote)
        .css({
            "top": e.pageY - 150, // 上移避免被鼠标遮挡
            "left": e.pageX,
            "color": getRandomColor(),
        });

    $("body").append($quoteElement);

    // 随机动画参数
    const startRotate = Math.floor(Math.random() * 41) - 20;
    const helf = Math.random() > 0.5;
    const endRotate = startRotate + (helf ? 15 : -10);
    const endX = (Math.random() * 60 - 30);
    const endY = - (Math.random() * 80 + 100);

    // 设置CSS变量用于动画
    $quoteElement[0].style.setProperty('--start-rotate', `${startRotate}deg`);
    $quoteElement[0].style.setProperty('--end-rotate', `${endRotate}deg`);
    $quoteElement[0].style.setProperty('--end-x', `${endX}px`);
    $quoteElement[0].style.setProperty('--end-y', `${endY}px`);

    // 至少1秒的动画持续时间
    const duration = Math.random() + 1.0;

    // 应用动画
    $quoteElement.css({
        "animation": `quote-float ${duration}s ease-out forwards`,
        "will-change": "transform, opacity"
    });

    // 动画结束后移除元素
    $quoteElement.on("animationend", function () {
        $quoteElement.remove();
    });

    if (helf) {
        getfetchHitokoto();
    }
});

function getRandomColor() {
    const r = Math.floor(Math.random() * 206) + 50; // 50-255 避免太暗
    const g = Math.floor(Math.random() * 206) + 50;
    const b = Math.floor(Math.random() * 206) + 50;
    const a = (Math.random() * 0.2 + 0.8).toFixed(2); // 透明度 0.8-1.0
    return `rgba(${r},${g},${b},${a})`;
}
// 获取一言 API
// 限制调用频率为每分钟一次
// 使用 fetch API 获取一言内容并添加到 quotes 数组中
// 如果获取失败或没有 hitokoto 字段，则输出错误信息
// 如果调用频率过快，则输出警告信息
async function getfetchHitokoto() {
    if (!getfetchHitokoto.lastCall) {
        getfetchHitokoto.lastCall = 0;
    }

    const now = Date.now();
    if (now - getfetchHitokoto.lastCall < 60000) {
        console.warn("调用频率太快，已被限制");
        return;
    }
    getfetchHitokoto.lastCall = now;

    try {
        const response = await fetch('https://v1.hitokoto.cn');
        const { hitokoto } = await response.json();
        if (hitokoto) {
            quotes.push(hitokoto);
            console.log("获取一言成功:", hitokoto);
        } else {
            console.error("获取一言失败");
        }
    } catch (error) {
        console.error("请求出错:", error);
    }
}