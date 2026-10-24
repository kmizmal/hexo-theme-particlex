'use strict';

// 模板 helper：从 cdn-config.js 取某个资源的 SRI 哈希。
//
// 用法：
//   <script src="<%- theme.vue.src %>" integrity="<%- cdn_sri('vue') %>" crossorigin="anonymous">
//
// 目的：integrity 只需要在一个地方声明（cdn-config.js 的 resources[].sri），
// 模板与主题 _config.yml 都不再重复写哈希，避免两边不一致导致脚本被浏览器拦截。
// 若该资源未声明 sri，则返回空串，模板据此不输出 integrity 属性。

const loadCdnConfig = require('./cdn-config-loader');

hexo.extend.helper.register('cdn_sri', function (name) {
  const cdn = loadCdnConfig(hexo.theme_dir);
  if (!cdn) return '';

  const prefix = String(name) + '@';
  const resource = (cdn.resources || []).filter((item) => String(item.key).indexOf(prefix) === 0)[0];
  return (resource && resource.sri) || '';
});
