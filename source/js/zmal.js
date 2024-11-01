// 进度条功能
(function (w, d) {
    // 创建一个进度条的div元素
    const domDiv = d.createElement('div');
    domDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 3px;' +
        'box-shadow: 0 0 3px #999; background: -webkit-linear-gradient(left, red, orange, yellow, green, blue, indigo, violet); z-index: 999999; -webkit-transition: width .3s linear;';
    
    // 将进度条添加到文档中
    d.body.appendChild(domDiv);
    
    // 获取可视窗口的高度
    const domH = w.innerHeight || d.documentElement.clientHeight || d.body.clientHeight;

    // 添加滚动事件监听器
    w.addEventListener('scroll', () => {
        // 计算滚动进度并设置进度条宽度
        const scrollWidth = Math.round(pageYOffset / (d.body.offsetHeight - domH) * 100) + '%';
        domDiv.style.width = scrollWidth;
    }, false);
})(window, document);

// 背景粒子效果
!function() {
    // 获取元素属性的函数
    function getAttribute(element, attr, defaultValue) {
        return element.getAttribute(attr) || defaultValue;
    }

    // 获取指定标签的所有元素
    function getElements(tag) {
        return document.getElementsByTagName(tag);
    }

    // 获取canvas的配置信息
    function getCanvasInfo() {
        var scripts = getElements("script"), lastScript = scripts.length - 1;
        return {
            l: lastScript + 1,
            z: getAttribute(scripts[lastScript], "zIndex", -1),
            o: getAttribute(scripts[lastScript], "opacity", 3),
            c: getAttribute(scripts[lastScript], "color", "255,0,0"),
            n: getAttribute(scripts[lastScript], "count", 85) // 粒子数量
        };
    }

    // 调整canvas大小
    function resizeCanvas() {
        a = canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        c = canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }

    // 动画函数
    function animate() {
        ctx.clearRect(0, 0, a, c); // 清除画布
        var n, e, t, o, m, l;

        // 遍历每个粒子
        particles.forEach(function(particle, index) {
            particle.x += particle.xa; // 更新粒子位置
            particle.y += particle.ya;

            // 反弹边界处理
            particle.xa *= (particle.x > a || particle.x < 0) ? -1 : 1;
            particle.ya *= (particle.y > c || particle.y < 0) ? -1 : 1;
            ctx.fillRect(particle.x - 0.5, particle.y - 0.5, 1, 1); // 绘制粒子

            // 检测与其他粒子的碰撞
            for (e = index + 1; e < particles.length; e++) {
                n = particles[e];
                if (n.x !== null && n.y !== null) {
                    o = particle.x - n.x;
                    m = particle.y - n.y;
                    l = o * o + m * m; // 计算距离

                    if (l < n.max) {
                        // 如果是鼠标粒子并且距离适中，推动其他粒子
                        if (n === mouse && l >= n.max / 2) {
                            particle.x -= 0.03 * o;
                            particle.y -= 0.03 * m;
                        }
                        t = (n.max - l) / n.max; // 计算透明度

                        // 颜色变化：缓慢过渡到随机颜色
                        if (!particle.color) {
                            particle.color = 'rgba(255, 0, 0, 1)'; // 默认颜色
                        }

                        // 生成新的目标颜色
                        if (!particle.targetColor || Math.random() < 0.01) { // 每 100 帧可能更换一次颜色
                            particle.targetColor = 'rgba(' + Math.floor(Math.random() * 255) + ',' +
                                                    Math.floor(Math.random() * 255) + ',' +
                                                    Math.floor(Math.random() * 255) + ',1)';
                        }

                        // 逐渐过渡到目标颜色
                        const currentColor = particle.color.match(/\d+/g).map(Number);
                        const targetColor = particle.targetColor.match(/\d+/g).map(Number);
                        const newColor = currentColor.map((value, index) => {
                            return Math.floor(value + (targetColor[index] - value) * 0.1); // 10%的过渡
                        });

                        particle.color = `rgba(${newColor.join(',')})`; // 更新当前颜色

                        ctx.beginPath();
                        ctx.lineWidth = t / 2; // 根据距离设置线宽
                        ctx.strokeStyle = particle.color; // 使用当前颜色
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(n.x, n.y);
                        ctx.stroke(); // 绘制连接线
                    }
                }
            }
        });
        requestAnimationFrame(animate); // 循环调用动画
    }

    var a, c, particles = [], canvas = document.createElement("canvas"),
        canvasInfo = getCanvasInfo(), l = "c_n" + canvasInfo.l, ctx = canvas.getContext("2d"),
        requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 45);
        },
        w = Math.random, mouse = { x: null, y: null, max: 20000 };

    // 设置canvas属性并添加到文档中
    canvas.id = l;
    canvas.style.cssText = "position:fixed;top:0;left:0;z-index:" + canvasInfo.z + ";opacity:" + canvasInfo.o + ";";
    document.body.appendChild(canvas);
    resizeCanvas(); // 调整canvas大小
    window.onresize = resizeCanvas; // 窗口调整时重新设置canvas大小

    // 鼠标移动事件
    window.onmousemove = function(e) {
        e = e || window.event;
        mouse.x = e.clientX; // 更新鼠标位置
        mouse.y = e.clientY;
    };

    // 鼠标移出事件
    window.onmouseout = function() {
        mouse.x = null;
        mouse.y = null;
    };

    // 生成粒子，数量为canvasInfo.n
    for (var f = 0; canvasInfo.n > f; f++) {
        var h = w() * a,
            g = w() * c,
            v = 2 * w() - 1,
            p = 2 * w() - 1;
        particles.push({ x: h, y: g, xa: v, ya: p, max: 6000 }); // 添加粒子
    }

    particles.push(mouse); // 添加鼠标粒子
    setTimeout(function() { animate(); }, 100); // 启动动画
}();

// 鼠标点击特效
const quotes = [
    "❤去活出你自己。❤", "❤今天的好计划胜过明天的完美计划。❤",
    "❤不要轻言放弃，否则对不起自己。❤", "❤紧要关头不放弃，绝望就会变成希望。❤",
    "❤如果不能改变结果，那就完善过程。❤", "❤好好活就是干有意义的事，有意义的事就是好好活！❤",
    "❤桃李春风一杯酒，江湖夜雨十年灯。❤", "❤欲买桂花同载酒，终不似，少年游。❤"
];

let a_idx = 0;

// 点击事件处理
$("body").click(function(e) {
    const quote = quotes[a_idx]; // 获取当前引用
    a_idx = (a_idx + 1) % quotes.length; // 更新索引

    const $quoteElement = $("<span class='quote'></span>").text(quote).css(getRandomStyles(e.pageX, e.pageY));
    $("body").append($quoteElement);
    
    // 生成随机旋转角度和消失时间
    const rotationAngle = Math.floor(Math.random() * 81) - 40; // [-40, 40]
    const disappearTime = Math.random() * 2.2 + 0.8; // [0.8, 3] 秒


    // 设置初始旋转和缩放
    $quoteElement.css({
        "transform": `rotate(${rotationAngle}deg) scale(1.5)`,
        "transition": `transform ${disappearTime}s ease, opacity ${disappearTime}s ease`
    });

    // 使用 requestAnimationFrame 确保样式更新
    requestAnimationFrame(() => {
        // 确保旋转动画生效后再触发消失动画
        setTimeout(() => {
            $quoteElement.css({
                "opacity": 0 // 使元素渐隐
            });
        }, 10); // 确保过渡生效
    });

    // 动画结束后移除元素
    $quoteElement.on('transitionend', function() {
        $quoteElement.remove();
    });
});

// 获取随机样式
function getRandomStyles(x, y) {
    return {
        "z-index": 9999,
        "top": y - 20,
        "left": x,
        "position": "absolute",
        "font-weight": "bold",
        "color": getRandomColor() // 获取随机颜色
    };
}

// 生成随机颜色
function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`; // 返回RGB格式的颜色
}
