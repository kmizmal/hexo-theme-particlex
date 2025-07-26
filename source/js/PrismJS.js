(function () {
    // const prismCoreURL = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0";
    // const componentURL = prismCoreURL + "/components/";
    // const pluginURL = prismCoreURL + "/plugins/";
    // let codeBlocks;
    // const langMap = {
    //     c: "c", cpp: "cpp", java: "java", python: "python",
    //     js: "javascript", javascript: "javascript", json: "json",
    //     html: "markup", xml: "markup", bash: "bash", shell: "bash",
    //     sh: "bash", md: "markdown", markdown: "markdown",
    //     yaml: "yaml", yml: "yaml", go: "go", php: "php", css: "css"
    // };

    // const loadScript = (src) => new Promise((resolve, reject) => {
    //     const s = document.createElement("script");
    //     s.src = src;
    //     s.defer = true;
    //     s.onload = resolve;
    //     s.onerror = reject;
    //     document.body.appendChild(s);
    // });
    // const detectLangs = () => {
    //     const langs = new Set();
    //     codeBlocks = document.querySelectorAll("code[class*='language-']");
    //     codeBlocks.forEach((code) => {
    //         const match = code.className.match(/language-([\w-]+)/);
    //         if (match) {
    //             const raw = match[1].toLowerCase();
    //             const mapped = langMap[raw] || raw;
    //             if (mapped !== "none") langs.add(mapped);
    //         }
    //     });
    //     return [...langs];
    // };
    const codeMean = () => {
        const codeBlocks = document.querySelectorAll("code[class*='language-']");

        codeBlocks.forEach((code) => {
            const pre = code.parentNode;
            // 避免重复插入
            if (!pre || pre.querySelector(".copycode")) return;

            const wrapper = document.createElement("div");
            wrapper.className = "code-wrapper";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            // 创建悬浮容器
            const copyDiv = document.createElement("div");
            copyDiv.className = "copycode";

            //创建代码语言指示器
            const lang = code.className.match(/language-([\w-]+)/);
            if (lang) {
                const langSpan = document.createElement("span");
                langSpan.className = "code-lang";
                langSpan.textContent = lang[1].toUpperCase();
                wrapper.appendChild(langSpan);
            }
            // 创建 copy 图标
            const iconCopy = document.createElement("i");
            iconCopy.className = "fa-solid fa-copy fa-fw";

            // 创建 check 图标
            const iconCheck = document.createElement("i");
            iconCheck.className = "fa-solid fa-check fa-fw";

            // 添加图标到容器
            copyDiv.appendChild(iconCopy);
            copyDiv.appendChild(iconCheck);

            wrapper.appendChild(copyDiv);
            // 复制事件
            copyDiv.addEventListener("click", () => {
                const codeText = code.innerText.trim();
                navigator.clipboard.writeText(codeText).then(() => {
                    copyDiv.classList.add("copied");

                    setTimeout(() => {
                        copyDiv.classList.remove("copied");
                    }, 1500);
                }).catch(() => {
                    alert("复制失败，请手动复制");
                });
            });
        });
    };


    // const loadPrismAndLanguages = async () => {
    //     // await loadScript(`${prismCoreURL}/prism.min.js`);
    //     // await loadScript(`${pluginURL}line-numbers/prism-line-numbers.min.js`);
    //     const langs = detectLangs();
    //     await Promise.all(
    //         langs.map((lang) =>
    //             loadScript(`${componentURL}prism-${lang}.min.js`).catch(() => {
    //                 console.warn(`Language '${lang}' not found`);
    //             })
    //         )
    //     );
    //     if (window.Prism) {
    //         // Prism.highlightAll();  
    //     }
    //     codeMean();
    // };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", codeMean);
    } else {
        codeMean();
    }
})();