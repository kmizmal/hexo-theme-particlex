mixins.highlight = {
    data() {
        return {
            copying: false,
            supportedLanguages: ['bash', 'javascript', 'python', 'html', 'css', 'batch'],
            cdnBase: 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/es/languages/'
        };
    },
    created() {
        hljs.configure({
            ignoreUnescapedHTML: true,
            languages: this.supportedLanguages
        });
        this.renderers.push(this.highlight);
    },
    methods: {
        async loadLanguage(language) {
            try {
                const langModule = await import(
                    /* webpackIgnore: true */
                    `${this.cdnBase}${language}.min.js`
                );
                hljs.registerLanguage(language, langModule.default);
                return true;
            } catch (error) {
                console.warn(`加载语言模块 ${language} 失败:`, error);
                return false;
            }
        },

        getLanguageClass(element) {
            const classElement = element.querySelector('code') || element;
            return [...classElement.classList]
                .find(c => c.startsWith('language-'))
                ?.replace('language-', '') || 'plaintext';
        },

        async highlight() {
            const codes = document.querySelectorAll("pre");
            
            await Promise.all(Array.from(codes).map(async (preElement) => {
                const code = preElement.textContent;
                const language = this.getLanguageClass(preElement);

                if (!hljs.getLanguage(language) && !await this.loadLanguage(language)) {
                    console.warn(`语言 ${language} 不支持，使用纯文本显示`);
                }

                try {
                    const highlighted = hljs.highlightAuto(code, this.supportedLanguages).value;
                    preElement.innerHTML = this.generateCodeHtml(highlighted, language);
                    this.addLineNumbers(preElement);
                    this.addCopyHandler(preElement, code);
                } catch (error) {
                    console.error('代码高亮失败:', error);
                }
            }));
        },

        generateCodeHtml(highlighted, language) {
            return `
                <code class="code-content hljs">${highlighted}</code>
                <div class="language">${language}</div>
                <div class="copycode" aria-label="复制代码">
                    <i class="fa-solid fa-copy"></i>
                    <i class="fa-solid fa-check"></i>
                </div>
            `;
        },

        addLineNumbers(preElement) {
            if (window.hljsLineNumbersBlock) {
                const content = preElement.querySelector('.code-content');
                window.hljsLineNumbersBlock(content, { singleLine: true });
            }
        },

        addCopyHandler(preElement, code) {
            const copyButton = preElement.querySelector('.copycode');
            copyButton.addEventListener('click', async () => {
                if (this.copying) return;
                
                this.copying = true;
                copyButton.classList.add('copied');
                
                try {
                    await navigator.clipboard.writeText(code);
                    await this.sleep(1500);
                } catch (error) {
                    console.error('复制失败:', error);
                    // 降级方案：使用 execCommand
                    const textArea = document.createElement('textarea');
                    textArea.value = code;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                } finally {
                    copyButton.classList.remove('copied');
                    this.copying = false;
                }
            });
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
};