/*!
 * cdn-config.js — CDN 优选的唯一真源
 *
 * 同一份配置被两个运行时共用：
 *   - 页面：/js/cdn-race.js 读取 providers 做探测、读写偏好
 *   - Service Worker：/sw.js 通过 importScripts() 读取 resources 做重写与回退
 *
 * 维护约定：
 *   1. 增删线路或资源后，必须递增 version —— 它是 SW 缓存命名空间的一部分，
 *      递增后旧缓存会在 activate 阶段被清理。
 *   2. bases 必须是"目录基底"（不带结尾斜杠）。SW 会把资源相对路径拼在后面，
 *      因此 CSS 内部的相对引用（如 ../webfonts/*.woff2、woff2/*.woff2）也能被正确解析。
 *   3. 声明了 sri 的资源，要求所有 bases 提供【字节完全一致】的文件；
 *      SW 会在返回前校验 sha384，不一致则自动跳到下一条线路。
 *      而且这类线路必须返回 Access-Control-Allow-Origin —— SW 需要读 body 才能校验，
 *      无 CORS 时只能拿到 opaque 响应，浏览器侧的 SRI 同样会失败。
 *
 * 全部 bases 与探针均已人工 curl 校验：返回 200，且同一资源的各线路 sha384 一致（2026-10）。
 */
(function (root) {
  'use strict';

  var CONFIG = {
    /* 配置版本：参与 SW 缓存命名空间，改动资源或线路时递增 */
    version: '2026-10-24.3',

    /* 总开关：设为 false 后 SW 不再拦截任何请求，并清空自身缓存 */
    enable: true,

    /* 偏好存储与有效期 */
    prefKey: 'cdn-pref',
    prefTTL: 30 * 60 * 1000,

    /* 探测参数：单次超时、采样次数（取中位数）、SW 回源超时 */
    probeTimeout: 1500,
    probeSamples: 2,
    fetchTimeout: 3000,

    /* SW 注册地址（本站部署在域名根路径） */
    swUrl: '/sw.js',
    swScope: '/',

    /*
     * 候选线路。数组顺序即"无偏好时的默认优先级"。
     * probe 统一指向 prism-core.min.js（约 2KB，各线路均存在，可代表该线路的建连 RTT）。
     *
     * zstatic 走 cdnjs 目录，其余六条都是 npm 目录；同一资源的路径形态不同，
     * 由 resources[].bases 逐条写明，不做模板拼装。
     */
    providers: [
      {
        id: 'zstatic',
        label: 'staticfile（zstatic，国内）',
        probe: 'https://s4.zstatic.net/ajax/libs/prism/1.29.0/components/prism-core.min.js'
      },
      {
        id: 'jsdelivr',
        label: 'jsDelivr（Cloudflare）',
        probe: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js'
      },
      {
        id: 'fastly',
        label: 'jsDelivr（Fastly）',
        probe: 'https://fastly.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js'
      },
      {
        id: 'gcore',
        label: 'jsDelivr（Gcore）',
        probe: 'https://gcore.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js'
      },
      {
        id: 'testingcf',
        label: 'jsDelivr（Cloudflare 备用节点）',
        probe: 'https://testingcf.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js'
      },
      {
        id: 'unpkg',
        label: 'unpkg',
        probe: 'https://unpkg.com/prismjs@1.29.0/components/prism-core.min.js'
      }
    ],

    /*
     * 受管资源。key 用于合成路径 /cdn/<key>/<rest>，也是 Cache 的键前缀。
     * aliases 用于匹配主题里"未锁版本"的旧地址（会被收敛到 key 指定的版本）。
     */
    resources: [
      {
        key: 'font-awesome@6.4.2',
        note: '主题 import.ejs 的 Font Awesome 6.4.2（CSS + ../webfonts/*）',
        bases: {
          zstatic: 'https://s4.zstatic.net/ajax/libs/font-awesome/6.4.2',
          jsdelivr: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2',
          fastly: 'https://fastly.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2',
          gcore: 'https://gcore.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2',
          testingcf: 'https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2',
          unpkg: 'https://unpkg.com/@fortawesome/fontawesome-free@6.4.2'
        }
      },
      {
        key: 'firacode@6.2.0',
        note: '代码字体 Fira Code（CSS + woff2/*、woff/*）；npm 包内位于 distr/ 子目录',
        bases: {
          zstatic: 'https://s4.zstatic.net/ajax/libs/firacode/6.2.0',
          jsdelivr: 'https://cdn.jsdelivr.net/npm/firacode@6.2.0/distr',
          fastly: 'https://fastly.jsdelivr.net/npm/firacode@6.2.0/distr',
          gcore: 'https://gcore.jsdelivr.net/npm/firacode@6.2.0/distr',
          testingcf: 'https://testingcf.jsdelivr.net/npm/firacode@6.2.0/distr',
          unpkg: 'https://unpkg.com/firacode@6.2.0/distr'
        }
      },
      {
        key: 'prismjs@1.29.0',
        note: '代码高亮主题与行号插件；主题 _config.yml 的 prismjs.cdn 指向本版本的 npm 目录',
        bases: {
          zstatic: 'https://s4.zstatic.net/ajax/libs/prism/1.29.0',
          jsdelivr: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0',
          fastly: 'https://fastly.jsdelivr.net/npm/prismjs@1.29.0',
          gcore: 'https://gcore.jsdelivr.net/npm/prismjs@1.29.0',
          testingcf: 'https://testingcf.jsdelivr.net/npm/prismjs@1.29.0',
          unpkg: 'https://unpkg.com/prismjs@1.29.0'
        }
      },
      {
        /*
         * 只挂 npm dist 家族，勿加 zstatic / cdnjs。
         * Vue 3.5.22 在公开 CDN 上有两个不同构建：
         *   npm dist  159,632 B  sha384-8b+88atX…  ← 本页使用的就是这份
         *   cdnjs     156,503 B  sha384-dXO0tVOG…  ← s4.zstatic.net / cdnjs.cloudflare.com
         * 两者字节不同，混入后必然被浏览器 SRI 拦截（表现为整站白屏）。
         * 另：registry.npmmirror.com 字节正确，但不返回 Access-Control-Allow-Origin，
         * SW 拿不到 body 无法校验，浏览器侧 SRI 同样失败，也不能加。
         */
        key: 'vue@3.5.22',
        note: 'Vue 3 全局构建；仅 npm dist 构建（见上方说明）',
        sri: 'sha384-8b+88atXoPL4ijtVqe+2pA+PC8VNYSGqubRseMLV0qxfa5GMHeftEEHvk4eM4RFT',
        bases: {
          jsdelivr: 'https://cdn.jsdelivr.net/npm/vue@3.5.22/dist',
          fastly: 'https://fastly.jsdelivr.net/npm/vue@3.5.22/dist',
          gcore: 'https://gcore.jsdelivr.net/npm/vue@3.5.22/dist',
          testingcf: 'https://testingcf.jsdelivr.net/npm/vue@3.5.22/dist',
          unpkg: 'https://unpkg.com/vue@3.5.22/dist'
        }
      },
      {
        key: 'jquery@3.7.1',
        note: 'jquery.slim.min.js；带 SRI，各线路字节一致（已比对）',
        sri: 'sha384-5AkRS45j4ukf+JbWAfHL8P4onPA9p0KwwP7pUdjSQA3ss9edbJUJc/XcYAiheSSz',
        bases: {
          zstatic: 'https://s4.zstatic.net/ajax/libs/jquery/3.7.1',
          jsdelivr: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist',
          fastly: 'https://fastly.jsdelivr.net/npm/jquery@3.7.1/dist',
          gcore: 'https://gcore.jsdelivr.net/npm/jquery@3.7.1/dist',
          testingcf: 'https://testingcf.jsdelivr.net/npm/jquery@3.7.1/dist',
          unpkg: 'https://unpkg.com/jquery@3.7.1/dist'
        }
      },
      {
        key: 'twikoo@1.6.44',
        note: '评论组件 twikoo.min.js；带 SRI，各线路字节一致（已比对）',
        sri: 'sha384-dZ/hSVfTPHuzXyECOYCetAvMd0cgqWxN5Fh+mwo86PV4GdU9xgQ/MNzh/YM/lotR',
        bases: {
          zstatic: 'https://s4.zstatic.net/npm/twikoo@1.6.44/dist',
          jsdelivr: 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist',
          fastly: 'https://fastly.jsdelivr.net/npm/twikoo@1.6.44/dist',
          gcore: 'https://gcore.jsdelivr.net/npm/twikoo@1.6.44/dist',
          testingcf: 'https://testingcf.jsdelivr.net/npm/twikoo@1.6.44/dist',
          unpkg: 'https://unpkg.com/twikoo@1.6.44/dist'
        }
      }
    ]
  };

  root.CDN_RACE_CONFIG = CONFIG;
})(typeof self !== 'undefined' ? self : this);
