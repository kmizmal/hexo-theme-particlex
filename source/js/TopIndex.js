// 进度条功能
(function (w, d) {
    // 创建一个进度条的div元素
    const progressBar = d.createElement('div');
    progressBar.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 0; 
        height: 3px; 
        box-shadow: 0 0 3px #999; 
        background: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet); 
        z-index: 999999; 
        transition: width 0.3s linear;
    `;

    // 将进度条添加到文档的 body 中
    d.body.appendChild(progressBar);

    // 获取可视窗口的高度
    const viewportHeight = w.innerHeight || d.documentElement.clientHeight || d.body.clientHeight;

    // 添加滚动事件监听器
    w.addEventListener('scroll', () => {
        // 文档的总高度减去可视窗口高度（可滚动的最大距离）
        const scrollableHeight = d.body.offsetHeight - viewportHeight;

        // 计算滚动的百分比
        const scrollPercent = (scrollY / scrollableHeight) * 100;

        // 设置进度条的宽度，确保数值在 0% 到 100% 之间
        progressBar.style.width = Math.min(Math.max(scrollPercent, 0), 100) + '%';
    }, false);
})(window, document);
