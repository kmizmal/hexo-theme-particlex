(function () {
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

            // 检查是否有有效的语言标记，并且语言不是 "none"
            const lang = code.className.match(/language-([\w-]+)/);
            if (lang) {
                const langSpan = document.createElement("span");
                langSpan.className = "code-lang";
                langSpan.textContent = lang[1].toUpperCase()=="NONE"? "𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★":lang[1].toUpperCase() ;
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", codeMean);
    } else {
        codeMean();
    }
})();
