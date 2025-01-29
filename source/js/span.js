// 鼠标点击特效
const quotes = [
    "❤去活出你自己。❤", "❤今天的好计划胜过明天的完美计划。❤",
    "❤不要轻言放弃，否则对不起自己。❤", "❤紧要关头不放弃，绝望就会变成希望。❤",
    "❤如果不能改变结果，那就完善过程。❤", "❤好好活就是干有意义的事，有意义的事就是好好活！❤",
    "❤桃李春风一杯酒，江湖夜雨十年灯。❤", "❤欲买桂花同载酒，终不似，少年游。❤"
];

let a_idx = 0;

$("body").click(function (e) {
    // 如果点击的是图片，不触发文字特效
    if ($(e.target).is("img")) return;

    const quote = quotes[a_idx];
    a_idx = (a_idx + 1) % quotes.length;

    const $quoteElement = $("<span class='quote'></span>")
        .text(quote)
        .css(getRandomStyles(e.pageX, e.pageY));
    $("body").append($quoteElement);

    const rotationAngle = Math.floor(Math.random() * 81) - 40;
    const disappearTime = Math.random() * 2.2 + 0.8;

    $quoteElement.css({
        "transform": `rotate(${rotationAngle}deg) scale(2.5)`,
        "transition": `transform ${disappearTime}s ease, opacity ${disappearTime}s ease`,
        "will-change": "transform, opacity"
    });

    requestAnimationFrame(() => {
        setTimeout(() => {
            $quoteElement.css({
                "opacity": 0,
                "transform": `translate(50px,-100px) scale(0.5) rotate(${rotationAngle / 2}deg)`
            });
        }, 10);
    });

    $quoteElement.on("transitionend", function () {
        $quoteElement.remove();
    });
});

function getRandomStyles(x, y) {
    return {
        "z-index": 9999,
        "top": y - 20,
        "left": x,
        "position": "absolute",
        "font-weight": "bold",
        "color": getRandomColor()
    };
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

