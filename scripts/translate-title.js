'use strict';

// 标题翻译（供根配置 permalink 中的 :Translate_title 使用）
// 默认调用 LibreTranslate 兼容 API 翻译标题，生成英文 slug。
// 可在主题 _config.yml 的 translate 中关闭、替换端点或调整超时。
//
// 优先级：front-matter 里手写的 Translate_title > 缓存 > 翻译 API > 清洗后的标题。
// front-matter 优先是刻意的：让 URL 随版本库走，可复现，
// 不受外部翻译服务可用性影响（否则同一篇文章在不同时间构建会得到不同链接）。

const fs = require('hexo-fs');
const path = require('path');

const rootConfig = hexo.config;
const themeConfig = (hexo.theme && hexo.theme.config) || {};
const translateConfig = themeConfig.translate || {};

// 默认开启；如未配置端点则使用内置 LibreTranslate 兼容地址
const ENABLED = translateConfig.enable !== false;
const API_URL = translateConfig.api || 'https://asfag654-libretranslate.hf.space/translate';
// 0 = 不限时（跟随网络，默认）；设为正数（毫秒）可作卡死保护
const TIMEOUT_MS = Number(translateConfig.timeout) || 0;

// 缓存写入站点根目录下的 .cache，避免污染 source/ 与版本库
const CACHE_DIR = path.join(hexo.base_dir, '.cache', 'translation');
const CACHE_FILE = path.join(CACHE_DIR, 'translation_cache.json');

function sanitizeTitle(title) {
  return String(title || '')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .replace(/\s+/g, '-');
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, { encoding: 'utf8' }) || '{}');
    }
  } catch (err) {
    hexo.log.error('\x1b[41m(>﹏<) 缓存文件读取出问题了喵 →\x1b[0m', err);
  }
  return {};
}

function saveCache(cache) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirsSync(CACHE_DIR);
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    hexo.log.info(`\x1b[32m(^∇^) 缓存保存成功！共存储 ${Object.keys(cache).length} 个翻译记忆啦~\x1b[0m`);
  } catch (err) {
    hexo.log.warn('\x1b[43m(,,・﹏・,,) 缓存保存失败，少女紧急修复中 →\x1b[0m', err);
  }
}

async function translate(title, source) {
  let controller;
  let timer;
  if (TIMEOUT_MS > 0) {
    controller = new AbortController();
    timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  }
  try {
    hexo.log.info(`\x1b[34m(。-ω-)zzz 少女奋笔疾书翻译中：\x1b[3m『${title}』\x1b[0m\x1b[34m ...`);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: title, source: source, target: 'en' }),
      ...(controller ? { signal: controller.signal } : {}),
    });
    const json = await res.json();
    if (json && json.translatedText) {
      return json.translatedText;
    }
    hexo.log.error("\x1b[45m(;´༎ຶД༎ຶ\`) 少女为你痛哭，翻译API抽风啦！响应数据 →\x1b[0m", json);
    return title;
  } catch (err) {
    hexo.log.error("\x1b[45m(つД\`) 翻译API连接失败，少女哭哭... 错误信息 →\x1b[0m", err);
    return title;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

hexo.extend.filter.register(
  'before_post_render',
  async function (data) {
    // 文章自己在 front-matter 里声明了 Translate_title 就用它，不再走缓存/API。
    // 这样 slug 是版本库里的显式数据：换机器、上 CI 都能生成同样的 URL。
    if (data.Translate_title && String(data.Translate_title).trim()) {
      return data;
    }

    const sanitizedTitle = sanitizeTitle(data.title);
    // 默认回退：清洗后的标题即 slug，保证 permalink 始终可用
    data.Translate_title = sanitizedTitle;

    if (!ENABLED || !API_URL) {
      return data;
    }

    const cache = loadCache();
    if (cache[sanitizedTitle]) {
      hexo.log.info(`\x1b[36mฅ^•ﻌ•^ฅ 从缓存堆里刨出闪闪发光的 \x1b[1m\x1b[4m📖『${sanitizedTitle}』\x1b[0m\x1b[36m ฅ( ̳• ·̫ • ̳)  \x1b[32m～➡️～  \x1b[35m✨${cache[sanitizedTitle]}✨\x1b[0m\x1b[36m 喵喵妙手get！(≧ω≦)ゞ\x1b[0m`);
      data.Translate_title = cache[sanitizedTitle];
      return data;
    }

    const translatedTitle = await translate(sanitizedTitle, (rootConfig.language || 'zh').split('-')[0]);
    if (translatedTitle && translatedTitle !== sanitizedTitle) {
      hexo.log.info(`成功翻译将${sanitizedTitle}翻译为${translatedTitle}`);
      data.Translate_title = translatedTitle.replace(/\s+/g, '-');
      cache[sanitizedTitle] = data.Translate_title;
      saveCache(cache);
    } else {
      hexo.log.info(`\x1b[37m(´•︵•\`) 标题没有变化，\x1b[3m『${sanitizedTitle}』\x1b[0m\x1b[37m 少女托腮发呆中...\x1b[0m`);
    }

    return data;
  },
  5
);
