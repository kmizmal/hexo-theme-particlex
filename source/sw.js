/*!
 * sw.js — CDN 优选 Service Worker
 *
 * 设计取舍（与"构建期改写成 /cdn/ 虚拟路径"的方案不同）：
 *   页面里的资源地址保持原样，SW 直接拦截发往受管 CDN 的请求并重新指向最快线路。
 *   原因：构建期改写会让首访（SW 尚未接管）的 /cdn/... 请求落到 404，
 *   导致首屏无样式；而直接拦截天然没有这个问题，且无需改动主题模板
 *   （themes/particlex 是独立子模块，尽量少动）。
 *   同时仍兼容 /cdn/<key>/<rest> 合成路径 —— CSS 命中 Cache 后，其内部相对引用
 *   会以合成路径解析，需要能被同一套路由接住。
 *
 * 职责：
 *   1. 拦截 → 按偏好顺序取回 → 失败逐个回退 → 全挂则交回浏览器原始请求；
 *   2. 按线路隔离 Cache（cdn-<版本>-<线路>），版本升级时清理旧 Cache；
 *   3. 对声明了 sri 的资源在本地校验 sha384，字节不一致就换下一条线路，
 *      避免跨线路内容差异触发浏览器 SRI 拦截。
 */
'use strict';

importScripts('./js/cdn-config.js');

var CONFIG = self.CDN_RACE_CONFIG || {};
var VERSION = CONFIG.version || 'dev';
var CACHE_PREFIX = 'cdn-' + VERSION + '-';
var DISABLED = CONFIG.enable === false;
var RESOURCES = CONFIG.resources || [];
var DEFAULT_CHAIN = (CONFIG.providers || []).map(function (provider) {
  return provider.id;
});

// 允许在子路径部署时也能拼出正确的合成路径
var SCOPE_PATH = (function () {
  try {
    return new URL(self.registration.scope).pathname;
  } catch (error) {
    return '/';
  }
})();
var CDN_PREFIX = SCOPE_PATH.replace(/\/+$/, '') + '/cdn/';

// 偏好需要跨 SW 冷启动存活：SW 被浏览器回收后 prefChain 会丢失，
// 而导航的 CSS 请求会在页面脚本 postMessage 之前就发出。这里用 Cache 存一份，
// 该键只作为存储使用，永远不会发起网络请求。
var META_CACHE = 'cdn-meta-' + VERSION;
var PREF_KEY = self.location.origin + SCOPE_PATH + '.cdn-pref.json';

var prefChain = null; // null 表示"跟随默认顺序"
var ROUTES = buildRoutes();
var prefLoaded = loadStoredPref();

/* ---------------- 路由表 ---------------- */

function buildRoutes() {
  var routes = [];

  RESOURCES.forEach(function (resource) {
    var prefixes = (resource.aliases || []).slice();
    Object.keys(resource.bases || {}).forEach(function (id) {
      prefixes.push(resource.bases[id]);
    });

    prefixes.forEach(function (prefix) {
      if (!prefix) return;
      routes.push({
        prefix: prefix.replace(/\/+$/, ''),
        resource: resource
      });
    });
  });

  // 长前缀优先，避免 prismjs 与 prismjs@1.29.0 之间相互遮蔽
  routes.sort(function (a, b) {
    return b.prefix.length - a.prefix.length;
  });

  return routes;
}

function matchRoute(url) {
  var i;

  // 1) 合成路径：/cdn/<key>/<rest>
  var syntheticPrefix = self.location.origin + CDN_PREFIX;
  if (url.indexOf(syntheticPrefix) === 0) {
    var tail = url.slice(syntheticPrefix.length);
    var slash = tail.indexOf('/');
    if (slash > 0) {
      var key = tail.slice(0, slash);
      var rest = tail.slice(slash + 1);
      for (i = 0; i < RESOURCES.length; i += 1) {
        if (RESOURCES[i].key === key) {
          return { resource: RESOURCES[i], rest: rest };
        }
      }
    }
    return null;
  }

  // 2) 原始 CDN 绝对地址
  for (i = 0; i < ROUTES.length; i += 1) {
    var route = ROUTES[i];
    if (url.indexOf(route.prefix + '/') === 0) {
      return {
        resource: route.resource,
        rest: url.slice(route.prefix.length + 1)
      };
    }
  }

  return null;
}

function chainFor(resource) {
  var chain = [];
  var ids = prefChain || DEFAULT_CHAIN;

  ids.forEach(function (id) {
    if (resource.bases[id] && chain.indexOf(id) === -1) chain.push(id);
  });
  DEFAULT_CHAIN.forEach(function (id) {
    if (resource.bases[id] && chain.indexOf(id) === -1) chain.push(id);
  });

  return chain;
}

/* ---------------- 偏好 ---------------- */

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type !== 'CDN_PREF_UPDATE') return;

  var chain = sanitizeChain(data.chain);
  if (!chain.length) return;

  prefChain = chain;
  saveStoredPref(chain);
});

function loadStoredPref() {
  return caches.open(META_CACHE).then(function (cache) {
    return cache.match(PREF_KEY);
  }).then(function (hit) {
    return hit ? hit.json() : null;
  }).then(function (stored) {
    var chain = sanitizeChain(stored && stored.chain);
    // 页面可能在读取完成前就已经下发了更新的偏好，此时不要覆盖
    if (chain.length && prefChain === null) prefChain = chain;
    return chain;
  }, function () {
    return null;
  });
}

function saveStoredPref(chain) {
  var body = JSON.stringify({ chain: chain, ts: Date.now() });
  return caches.open(META_CACHE).then(function (cache) {
    return cache.put(PREF_KEY, new Response(body, {
      headers: { 'content-type': 'application/json' }
    }));
  }).then(null, function () {});
}

function sanitizeChain(chain) {
  if (!chain || !chain.length) return [];

  var known = {};
  DEFAULT_CHAIN.forEach(function (id) { known[id] = true; });

  var seen = {};
  return chain.filter(function (id) {
    if (!known[id] || seen[id]) return false;
    seen[id] = true;
    return true;
  });
}

/* ---------------- 工具 ---------------- */

function fetchWithTimeout(url, timeout) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = self.setTimeout(function () {
      if (settled) return;
      settled = true;
      reject(new Error('timeout: ' + url));
    }, timeout || 3000);

    fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow'
    }).then(function (response) {
      if (settled) return;
      settled = true;
      self.clearTimeout(timer);
      resolve(response);
    }, function (error) {
      if (settled) return;
      settled = true;
      self.clearTimeout(timer);
      reject(error);
    });
  });
}

// 只保留与内容解释直接相关的响应头，避免把上游的 content-length / content-encoding
// 原样带到"重新构造的 Response"上造成长度不匹配
var KEEP_HEADERS = [
  'content-type',
  'cache-control',
  'expires',
  'etag',
  'last-modified',
  'access-control-allow-origin',
  'content-language',
  'vary'
];

function safeHeaders(headers) {
  var out = new Headers();
  KEEP_HEADERS.forEach(function (name) {
    var value = headers.get(name);
    if (value) out.set(name, value);
  });
  return out;
}

function toBase64(bytes) {
  var binary = '';
  for (var i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/*
 * SRI 校验：只有声明了 sri 的资源才需要把 body 读全。
 * 返回 null 表示字节不匹配，调用方会切到下一条线路。
 */
function verifyIntegrity(response, sri) {
  if (!sri) return Promise.resolve(response);

  var expected = String(sri).replace(/^sha384-/, '');

  return response.arrayBuffer().then(function (buffer) {
    return crypto.subtle.digest('SHA-384', buffer).then(function (digest) {
      if (toBase64(new Uint8Array(digest)) !== expected) return null;
      return new Response(buffer, {
        status: response.status,
        statusText: response.statusText,
        headers: safeHeaders(response.headers)
      });
    });
  }, function () {
    return null;
  });
}

function putCache(cache, key, response) {
  // 配额超限或私密模式下写入失败，不影响本次返回
  return cache.put(key, response.clone()).then(null, function () {});
}

/* ---------------- 取回与回退 ---------------- */

function respond(request, target, chain, index) {
  if (index >= chain.length) {
    // 全部线路都不行：交回浏览器原始请求（原始请求本身就是原 CDN 地址）
    return fetch(request).then(null, function () {
      return Response.error();
    });
  }

  var provider = chain[index];
  var upstream = target.resource.bases[provider] + '/' + target.rest;
  var cacheName = CACHE_PREFIX + provider;
  var cacheKey = self.location.origin + CDN_PREFIX + target.resource.key + '/' + target.rest;

  function failover() {
    return respond(request, target, chain, index + 1);
  }

  return caches.open(cacheName).then(function (cache) {
    return cache.match(cacheKey).then(function (cached) {
      if (cached) return cached;

      return fetchWithTimeout(upstream, CONFIG.fetchTimeout).then(function (response) {
        if (!response || !response.ok) return failover();

        return verifyIntegrity(response, target.resource.sri).then(function (verified) {
          if (!verified) return failover();
          return putCache(cache, cacheKey, verified).then(function () {
            return verified;
          });
        });
      }, failover);
    }, failover);
  }, failover);
}

/* ---------------- 生命周期 ---------------- */

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    pruneCaches()
  ]));
});

function pruneCaches() {
  return caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) {
      if (name.indexOf('cdn-') !== 0) return null;
      // 偏好存储跨版本保留，避免升级后首帧退回默认线路
      if (name.indexOf('cdn-meta-') === 0) return null;
      if (name.indexOf(CACHE_PREFIX) === 0) return null;
      return caches.delete(name);
    }));
  });
}

self.addEventListener('fetch', function (event) {
  if (DISABLED) return;

  var request = event.request;
  if (request.method !== 'GET') return;

  var target = matchRoute(request.url);
  if (!target) return;

  // 等偏好从持久化存储恢复后再决定线路，避免冷启动首帧误用默认线路
  event.respondWith(prefLoaded.then(function () {
    return respond(request, target, chainFor(target.resource), 0);
  }));
});
