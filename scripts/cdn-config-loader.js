'use strict';

// 构建期读取 source/js/cdn-config.js 的工具函数，供 cdn-helper.js 与 cdn-config-guard.js 共用。
// 该文件是 IIFE，只向 self 挂一个对象，因此在沙箱里执行即可取出配置，无需解析源码文本。
//
// 带 mtime 缓存：hexo generate --watch 时配置改动会自动失效，不必重启。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CONFIG_RELATIVE_PATH = path.join('source', 'js', 'cdn-config.js');

let cachedFile = null;
let cachedMtime = 0;
let cachedConfig = null;

module.exports = function loadCdnConfig(themeDir) {
  const file = path.join(themeDir, CONFIG_RELATIVE_PATH);
  if (!fs.existsSync(file)) return null;

  const mtime = fs.statSync(file).mtimeMs;
  if (cachedFile === file && cachedMtime === mtime) return cachedConfig;

  const sandbox = { self: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });

  cachedFile = file;
  cachedMtime = mtime;
  cachedConfig = (sandbox.self && sandbox.self.CDN_RACE_CONFIG) || null;
  return cachedConfig;
};
