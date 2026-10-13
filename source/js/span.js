// 鼠标点击特效
(function() {
    // 初始语录
    const quotes = [
        "去活出你自己。", "今天的好计划胜过明天的完美计划。",
        "不要轻言放弃，否则对不起自己。", "紧要关头不放弃，绝望就会变成希望。",
        "如果不能改变结果，那就完善过程。", "好好活就是干有意义的事，有意义的事就是好好活！",
        "桃李春风一杯酒，江湖夜雨十年灯。", "欲买桂花同载酒，终不似，少年游。"
    ];

    // 检查目标元素是否应该触发特效
    function shouldTriggerEffect(target) {
        const $target = $(target);
        
        // 排除图片
        if ($target.is("img")) return false;
        
        // 排除链接及其子元素
        if ($target.is("a") || $target.closest("a").length > 0) return false;
        
        // 排除代码块及其子元素
        if ($target.closest("pre").length > 0) return false;
        
        // 可以根据需要排除评论区
        // if ($target.closest("#comment").length > 0) return false;
        
        return true;
    }

    // 生成随机颜色
    function getRandomColor() {
        const r = Math.floor(Math.random() * 206) + 50; // 50-255 避免太暗
        const g = Math.floor(Math.random() * 206) + 50;
        const b = Math.floor(Math.random() * 206) + 50;
        const a = (Math.random() * 0.2 + 0.8).toFixed(2); // 透明度 0.8-1.0
        return `rgba(${r},${g},${b},${a})`;
    }

    // 创建并显示语录动画
    function showQuoteAnimation(e) {
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
        const shouldFetch = Math.random() > 0.5;
        const endRotate = startRotate + (shouldFetch ? 15 : -10);
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
        $quoteElement.on("animationend", function() {
            $quoteElement.remove();
        });

        // 随机获取一言
        if (shouldFetch) {
            fetchHitokoto();
        }
    }

    // 获取一言 API（底层去重请求，供侧边卡片与点击特效共用，避免重复请求）
    async function requestHitokoto() {
        if (requestHitokoto._inflight) return requestHitokoto._inflight;

        requestHitokoto._inflight = (async () => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000); // 5s 超时
            try {
                const response = await fetch('https://v1.hitokoto.cn', { signal: controller.signal });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (!data || !data.hitokoto) throw new Error('响应中没有 hitokoto 字段');
                return data;
            } catch (error) {
                console.warn('获取一言失败:', error.message || error);
                return null;
            } finally {
                clearTimeout(timer);
                requestHitokoto._inflight = null;
            }
        })();

        return requestHitokoto._inflight;
    }

    // 填充侧边卡片的一言（页面加载时调用一次，与点击特效共用同一去重请求）
    function fillCardHitokoto() {
        const el = document.querySelector("#hitokoto_text");
        if (!el) return;
        requestHitokoto().then((data) => {
            if (data && data.hitokoto) {
                el.textContent = data.hitokoto;
                el.href = "https://hitokoto.cn/?uuid=" + data.uuid;
                if (quotes.length < 50) quotes.push(data.hitokoto);
            } else {
                el.textContent = "愿你今天也有好心情~";
            }
        }).catch(() => {
            el.textContent = "愿你今天也有好心情~";
        });
    }

    // 点击特效触发的补充（保留 1 分钟节流，避免频繁刷新语录池）
    async function fetchHitokoto() {
        const now = Date.now();
        if (now - (fetchHitokoto._last || 0) < 60000) return;
        fetchHitokoto._last = now;

        const data = await requestHitokoto();
        if (data && data.hitokoto && quotes.length < 50) {
            quotes.push(data.hitokoto);
        }
    }

    // 暴露统一请求入口，供其他脚本复用（共用去重后的请求）
    window.zmalHitokoto = { fetch: requestHitokoto };

    // 绑定点击事件
    $("body").on("click", function(e) {
        if (shouldTriggerEffect(e.target)) {
            showQuoteAnimation(e);
        }
    });

    // 页面加载后填充侧边卡片一言（与点击特效共用去重请求）
    $(fillCardHitokoto);
})();