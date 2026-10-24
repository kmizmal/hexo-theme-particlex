# CDN 测速与自动优选

按访客真实网络状况，在多个 CDN 之间自动选择最快线路加载受管的 js/css/字体资源；某条线路不可用或内容不一致时逐级回退。

## 文件构成

全部位于主题内（`themes/particlex`），站点根目录不新增任何脚本：

| 文件 | 作用 |
| --- | --- |
| `themes/particlex/source/js/cdn-config.js` | 配置源：线路表、资源表、版本号、偏好有效期。页面与 SW 共用 |
| `themes/particlex/source/js/cdn-race.js` | 前端测速，结果写入 `localStorage['cdn-pref']` 并 `postMessage` 给 SW |
| `themes/particlex/source/sw.js` | 拦截受管资源请求 → 按偏好换线路 → 失败回退 → 按线路隔离缓存 |
| `themes/particlex/_config.yml` | 外链资产：`fontAwesome` / `firaCode` / `jquery` / `vue` / `prismjs.cdn` |
| `themes/particlex/layout/import.ejs` | 在 `<head>` 内按配置渲染全部外链，并引入上面两个脚本（`defer`） |
| `themes/particlex/scripts/cdn-helper.js` | 注册 `cdn_sri()`，模板据此从 `cdn-config.js` 取哈希 |
| `themes/particlex/scripts/cdn-config-loader.js` | 上面两个脚本共用：在沙箱里执行 `cdn-config.js` 并带 mtime 缓存 |
| `themes/particlex/scripts/cdn-config-guard.js` | 构建期校验外链地址是否落在 `bases` 内、脚本是否声明了 `sri` |

站点侧只保留一条配置：根 `_config.yml` 的 `skip_render`。hexo-babel 注册了 `js → js` 渲染器，若不跳过，
`sw.js` 会被当作普通脚本转译；`skip_render` 由 asset 处理器统一判定，对主题 source 同样生效。

## 候选线路

| id | 域名 | 目录形态 | 探针 |
| --- | --- | --- | --- |
| `zstatic` | `s4.zstatic.net`（staticfile，国内） | cdnjs | `ajax/libs/prism/1.29.0/components/prism-core.min.js` |
| `jsdelivr` | `cdn.jsdelivr.net`（Cloudflare） | npm | `npm/prismjs@1.29.0/components/prism-core.min.js` |
| `fastly` | `fastly.jsdelivr.net`（Fastly） | npm | 同上 |
| `gcore` | `gcore.jsdelivr.net`（Gcore） | npm | 同上 |
| `testingcf` | `testingcf.jsdelivr.net`（Cloudflare 备用节点） | npm | 同上 |
| `unpkg` | `unpkg.com` | npm | 同上 |

六条线路均返回 `Access-Control-Allow-Origin: *`，SW 可以用 CORS 方式回源、读到真实状态码（能识别 404 并切换），也能读 body 做 SRI 校验。
`gcore` 与 `testingcf` 是国内访问 jsDelivr 时常用的两个备用入口，与主站同源同内容，纳入后测速覆盖更完整。
`cdn.bootcdn.net` 实测不可达、`registry.npmmirror.com` 不返回 CORS 头，均未纳入。

## 受管资源

| key | 说明 |
| --- | --- |
| `font-awesome@6.4.2` | CSS 及 `../webfonts/*` |
| `firacode@6.2.0` | CSS 及 `woff2/*`、`woff/*`（npm 包内位于 `distr/`） |
| `prismjs@1.29.0` | 主题与行号插件 CSS；页面地址由 `prismjs.cdn` 拼接，版本已锁定 |
| `vue@3.5.22` | `vue.global.prod.js`，带 SRI；**只挂 npm 家族**（见下） |
| `jquery@3.7.1` | `jquery.slim.min.js`，带 SRI |
| `twikoo@1.6.44` | `twikoo.min.js`，带 SRI |

### Vue 为什么把 zstatic 剔除了

Vue 3.5.22 在公开 CDN 上存在**两个不同构建**，不是同一文件的镜像差异：

| 构建 | 大小 | sha384 | 来源 |
| --- | --- | --- | --- |
| npm dist | 159,632 B | `8b+88atX…` | jsDelivr / Fastly / Gcore / testingcf / unpkg |
| cdnjs | 156,503 B | `dXO0tVOG…` | cdnjs / zstatic |

页面已统一改用 npm dist 并保留 `integrity`，因此 cdnjs 家族（含量少、且国内只剩 zstatic）不能参与——
一旦被 SW 换上去，浏览器会按 SRI 拦截执行，表现为整站白屏。按"少数派剔除"的原则，zstatic 从 Vue 的候选里移除。

代价与补偿：

- 代价是 Vue 失去了国内线路，首访直接走 jsDelivr。
- 因此 `import.ejs` 的 Vue 标签上挂了 `onerror`，失败时切到 `gcore.jsdelivr.net`——同字节，`integrity` 无需改动即可通过。
- 这个 `onerror` 只保护首访；SW 接管后由 5 条 npm 线路自动回退。
- 若要彻底恢复国内速度，正确做法是把 npm dist 的这份文件自托管到自有存储（保证字节一致），再作为一种线路加入 `bases`。

### 外链配置与 cdn-config.js 的对应关系

`import.ejs` 里不写任何 CDN 地址，全部来自主题 `_config.yml`；也不写任何 SRI 哈希。

| 配置项 | 页面字段 | 与 `cdn-config.js` 的关系 |
| --- | --- | --- |
| `fontAwesome.src` / `firaCode.src` | `href` | 必须落在对应资源的 `bases` 内，否则 SW 匹配不到 |
| `prismjs.cdn` | 拼成 `…/themes/<theme>.min.css` 与 `…/plugins/line-numbers/…` | 同上；版本号要与 `prismjs@<version>` 一致 |
| `jquery.src` / `.fallback` | `src` / `onerror` | 地址需落在 `bases` 内；`integrity` 由模板自动取 `resources[].sri` |
| `vue.src` / `.fallback` | 同上 | 同上 |

哈希的**唯一出处**是 `cdn-config.js` 的 `resources[].sri`，三个消费方各取所需：

| 消费方 | 用途 |
| --- | --- |
| 模板 `cdn_sri('vue')` | 输出到页面 `integrity`，浏览器解析时校验（首访也生效） |
| SW `verifyIntegrity()` | 换线路前比对字节，决定这条线路能不能用 |
| 构建期守卫 | 只检查"有没有声明"，不再比对两份副本 |

要彻底关掉某个脚本的 SRI：删掉 `cdn-config.js` 里对应的 `sri` 字段即可——页面自动不再输出
`integrity`，行为与普通资源一致，守卫会告警提示"失去完整性校验"。

`scripts/cdn-config-guard.js` 在 `before_generate` 阶段检查：

- 地址不在任何 `bases` 覆盖范围内 → 告警（仅降级为直连，站点仍可用）；
- 脚本资源未声明 `sri` → 告警（说明页面不会有完整性校验）；
- `fallback` 与 `src` 指向同一线路 → 告警。

## 关键行为

- **偏好有效期**：30 分钟（`prefTTL`）。过期后重新测速。
- **测速方式**：每条线路采样 2 次取中位数，单次超时 1500ms；全部超时则沿用默认顺序，不写偏好。
- **生效时机**：首访时 SW 尚未接管，资源走原地址；测速结果在页面加载后下发，从下一次导航起生效。
- **偏好持久化**：SW 把偏好另存一份到 `cdn-meta-<版本>` 缓存，避免浏览器回收 SW 后首帧退回默认线路。
- **回退顺序**：偏好线路 → 其余线路 → 浏览器原始请求。单次回源超时 3000ms。
- **缓存隔离**：`cdn-<版本>-<线路>`，每条线路独立；`version` 递增时清理其余版本。
- **SRI 校验**：配置里声明了 `sri` 的资源，SW 会把响应读全并校验 sha384，不一致就换下一条线路，且不写入缓存。
- **总开关**：`cdn-config.js` 的 `enable: false` 后 SW 不再拦截任何请求。

## 维护步骤

改版本或换线路时：

1. 改 `themes/particlex/source/js/cdn-config.js`：更新 `resources[].bases`、`providers`，并**递增 `version`**（缓存命名空间随之更新）。
   换任何外链的版本时，同步改主题 `_config.yml` 对应段的 `src`（`key` 里的版本号也要跟着改）。哈希只在 `cdn-config.js` 一处，模板不用动。
2. 新增带 SRI 的资源前，先确认各线路字节一致：

   ```bash
   for u in <线路A地址> <线路B地址>; do
     curl -sL "$u" | openssl dgst -sha384 -binary | openssl base64 -A; echo "  $u"
   done
   ```

   不一致就只能保留单线路，否则会触发浏览器 SRI 拦截。
3. 新增或重命名 `source` 下的脚本时，同步更新根 `_config.yml` 的 `skip_render`（按 source 相对路径写）。
4. 这些改动在主题子模块内：需先在 `themes/particlex` 提交并推送到 `hexo-theme-particlex`，
   再在主仓库提交子模块指针。CI 用 `submodules: true` 检出，两边都要推。

## 部署注意

- 站点必须 HTTPS（当前 `blog.zmal.top` 满足），SW 作用域为根路径。
- **EdgeOne 需为 `/sw.js` 配置 `Cache-Control: no-cache`**，否则 SW 脚本可能被长缓存，导致发布后长时间不更新。
- 本地验证只能用 `http://localhost` 或 `127.0.0.1`，`http://192.168.x.x` 属非安全上下文，SW 不生效。

## 验证清单

1. DevTools → Application → Service Workers：`/sw.js` 为 activated，页面状态 controlling。
2. Console 执行 `cdnRace.read()`：应返回 `{ chain: [...], ts, rtt }`。
3. 强制切换线路，确认资源真实换源：

   ```js
   localStorage.setItem('cdn-pref', JSON.stringify({ chain: ['gcore','unpkg','jsdelivr','fastly','testingcf','zstatic'], ts: Date.now() }));
   // 刷新两次（第一次导航时偏好尚未传到 SW）
   ```

   之后 `caches.keys()` 应出现 `cdn-<版本>-unpkg`，且其中包含 `font-awesome`、`webfonts` 等条目。
4. 断网测试回退：DevTools → Network → 对某条线路域名加 blocking 规则，确认自动落到次选且页面不破版。
5. `cdnRace.clear()` 后刷新：应重新测速并按默认顺序出内容。
6. 换线路后确认图标与代码字体未错乱（`getComputedStyle(el,'::before').fontFamily` 含 `Font Awesome`）。

## 已知限制

1. **首屏不可能已经优选**：测速必然晚于首批资源请求，因此首访（以及偏好刚过期的那次）用默认或已存偏好线路。
2. **Vue 首访没有国内线路**：npm 家族里没有可用的国内 CORS 源，首访固定走 jsDelivr，仅靠标签上的 `onerror` 退到 gcore；SW 接管后才有多线路优选。要彻底解决需自托管同字节副本。
3. **`@font-face` 跟随 CSS 的解析基准**：CSS 直接从 CDN 返回时，字体直连该线路；CSS 命中 Cache 时，字体以 `/cdn/<key>/<rest>` 解析并由 SW 接管，两种路径都可用。
4. **Gitalk / Waline / KaTeX / crypto-js**：主题里默认关闭，启用后需自行把地址补进 `resources`（同样先比对字节一致性）。
