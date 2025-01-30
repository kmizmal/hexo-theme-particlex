mixins.highlight = {
    data() {
        return {
            copying: false,
            supportedLanguages: ['bash', 'javascript', 'python', 'html', 'css']
        };
    },
    created() {

        hljs.configure({
            ignoreUnescapedHTML: true,
            languages: this.supportedLanguages // 限制自动检测范围
        });
        this.renderers.push(this.highlight);
    },
    methods: {
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        getLanguageClass(element) {
            const classes = [...element.classList, ...(element.firstChild?.classList || [])];
            return classes.find(c => c.startsWith('language-'))?.replace('language-', '') || 'plaintext';
        },

        async highlight() {
            const codes = document.querySelectorAll("pre");

            for (const preElement of codes) {
                const code = preElement.textContent;
                const language = this.getLanguageClass(preElement);

                if (!hljs.getLanguage(language)) {
                    try {
                        const langModule = await import(`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/languages/${language}.min.js`);
                        hljs.registerLanguage(language, langModule.default);
                    } catch {
                        console.warn(`Language ${language} not supported`);
                    }
                }

                let highlighted;
                try {
                    highlighted = hljs.highlight(code, {
                        language,
                        ignoreIllegals: true
                    }).value;
                } catch {
                    highlighted = hljs.highlightAuto(code).value;
                }

                preElement.innerHTML = `
  <code class="code-content hljs">${highlighted}</code>
  <div class="language">${language}</div>
  <div class="copycode">
    <i class="fa-solid fa-copy fa-fw"></i>
    <i class="fa-solid fa-check fa-fw"></i>
  </div>
`;

                const content = preElement.querySelector(".code-content");

                if (window.hljsLineNumbersBlock) {
                    window.hljsLineNumbersBlock(content, {
                        singleLine: true
                    });
                }

                const copycode = preElement.querySelector(".copycode");
                copycode.addEventListener("click", async () => {
                    if (this.copying) return;
                    this.copying = true;
                    copycode.classList.add("copied");
                    await navigator.clipboard.writeText(code);
                    await this.sleep(1000);
                    copycode.classList.remove("copied");
                    this.copying = false;
                });
            }
        }
    }
};