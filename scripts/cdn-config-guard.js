'use strict';

// 构建期一致性守卫：主题 _config.yml 里的外链配置 ↔ source/js/cdn-config.js 的资源表。
//
// 哈希现在只有 cdn-config.js 一处出处（模板通过 cdn_sri() 取），所以这里不再比对
// integrity —— 没有第二份副本，也就不存在"漏改一边"的可能。
//
// 检查项：
//   1. 每个外链地址必须落在某条 bases 覆盖范围内，否则 SW 匹配不到、该请求
//      只会降级为直连 —— 站点仍可用，因此只告警。
//   2. 脚本类资源（vue / jquery）应在配置里声明 sri，否则页面不会输出 integrity。
//   3. fallback 与 src 指向同一线路没有意义。

const loadCdnConfig = require('./cdn-config-loader');

// 该 URL 由哪条资源配置接管；未命中返回 null（说明 SW 的 matchRoute 也匹配不到）
function findResource(url, resources) {
  for (let i = 0; i < resources.length; i += 1) {
    const bases = resources[i].bases || {};
    const ids = Object.keys(bases);
    for (let j = 0; j < ids.length; j += 1) {
      const base = bases[ids[j]];
      if (url === base || url.indexOf(base + '/') === 0) return resources[i];
    }
  }
  return null;
}

function checkAsset(label, url, resources) {
  if (!url) return null;

  const resource = findResource(url, resources);
  if (!resource) {
    hexo.log.warn(
      '[cdn] ' + label + ' 不在 cdn-config.js 的 bases 覆盖范围内，该请求不会被 SW 切换线路：' + url
    );
  }
  return resource;
}

function check() {
  const themeConfig = (hexo.theme && hexo.theme.config) || {};
  const cdn = loadCdnConfig(hexo.theme_dir);
  if (!cdn) return; // 没有 cdn-config.js 时无从比对，交由运行时自身容错

  const resources = cdn.resources || [];
  const enabled = (section) => !!section && section.enable !== false;

  ['vue', 'jquery'].forEach((name) => {
    const config = themeConfig[name];
    if (!enabled(config)) return;

    const resource = checkAsset(name + '.src', config.src, resources);
    checkAsset(name + '.fallback', config.fallback, resources);

    if (resource && !resource.sri) {
      hexo.log.warn(
        '[cdn] ' + resource.key + ' 未声明 sri，页面里的 ' + name + ' 将不输出 integrity，失去完整性校验。'
      );
    }
    if (config.fallback && config.fallback === config.src) {
      hexo.log.warn('[cdn] ' + name + '.fallback 与 src 指向同一线路，兜底没有意义。');
    }
  });

  if (enabled(themeConfig.fontAwesome)) {
    checkAsset('fontAwesome.src', themeConfig.fontAwesome.src, resources);
  }
  if (enabled(themeConfig.firaCode)) {
    checkAsset('firaCode.src', themeConfig.firaCode.src, resources);
  }
  if (enabled(themeConfig.prismjs) && themeConfig.prismjs.cdn) {
    checkAsset('prismjs.cdn', themeConfig.prismjs.cdn, resources);
  }
}

hexo.extend.filter.register('before_generate', check);
