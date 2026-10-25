/*!
 * cdn-race.js — 前端测速与偏好下发
 *
 * 流程：
 *   1. 读取 localStorage 中的偏好；未过期（默认 30 分钟）则直接下发给 SW，不重复测速；
 *   2. 否则并行探测各线路的探针文件，取中位数作为 RTT，剔除超时线路，得到优先链；
 *   3. 优先链写入 localStorage，并通过 postMessage 通知 /sw.js；
 *   4. 首次访问时页面尚未被 SW 接管，故在 navigator.serviceWorker.ready 与
 *      controllerchange 时各补发一次。
 *
 * 注意：
 *   - 本文件刻意只用 ES5 语法（var/function/Promise），避免被 hexo-babel
 *     转译成依赖 regeneratorRuntime 的代码；同时已在 _config.yml 的
 *     skip_render 中排除，不做二次处理。
 *   - 测速只决定"用哪条线路"，不会改写页面里的任何资源地址：
 *     资源原始地址保持不变，由 SW 在 fetch 阶段重新指向最快线路，
 *     因此首访（SW 尚未接管）仍走原地址，不会出现 404 或白屏。
 */
(function () {
  'use strict';

  var CONFIG = self.CDN_RACE_CONFIG;
  if (!CONFIG || !CONFIG.enable) return;

  var TAG = '[cdn-race]';

  function noop() {}

  function log() {
    if (!self.console || !self.console.info) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift(TAG);
    self.console.info.apply(self.console, args);
  }

  function nowMs() {
    return self.performance && self.performance.now ? self.performance.now() : Date.now();
  }

  function median(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /* ---------------- 偏好存取 ---------------- */

  function readPref() {
    try {
      var raw = self.localStorage.getItem(CONFIG.prefKey);
      if (!raw) return null;
      var pref = JSON.parse(raw);
      if (!pref || !pref.chain || !pref.chain.length) return null;
      return pref;
    } catch (error) {
      return null;
    }
  }

  function writePref(pref) {
    try {
      self.localStorage.setItem(CONFIG.prefKey, JSON.stringify(pref));
    } catch (error) {
      // 隐私模式/配额满：写入失败不影响本次会话（仍会 postMessage 给 SW）
    }
  }

  function isFresh(pref) {
    return !!pref && typeof pref.ts === 'number' && (Date.now() - pref.ts) < CONFIG.prefTTL;
  }

  /* ---------------- 与 SW 通信 ---------------- */

  function notify(pref) {
    var container = navigator.serviceWorker;
    if (!container || !pref || !pref.chain || !pref.chain.length) return;

    var message = {
      type: 'CDN_PREF_UPDATE',
      chain: pref.chain,
      primary: pref.chain[0],
      ts: pref.ts || Date.now()
    };

    function send() {
      if (container.controller) container.controller.postMessage(message);
    }

    send();
    if (container.ready && container.ready.then) container.ready.then(send, noop);
  }

  /* ---------------- 测速 ---------------- */

  function sampleProvider(provider) {
    return new Promise(function (resolve) {
      var samples = [];
      var attempt = 0;

      function next() {
        if (attempt >= CONFIG.probeSamples) {
          resolve(samples.length ? median(samples) : Infinity);
          return;
        }
        attempt += 1;

        var started = nowMs();
        var settled = false;
        var timer = self.setTimeout(function () {
          if (settled) return;
          settled = true;
          // 超时视为本次采样失败，继续下一次
          next();
        }, CONFIG.probeTimeout);

        // cache: 'no-store' 让请求绕过浏览器缓存，否则命中本地缓存会让所有线路都显示 ~0ms
        // noCors 线路（自建图床等不返回 CORS 头的站点）只能取 opaque 响应，读不到状态码
        self.fetch(provider.probe, {
          mode: provider.noCors ? 'no-cors' : 'cors',
          cache: 'no-store',
          credentials: 'omit'
        }).then(function (response) {
          if (settled) return;
          settled = true;
          self.clearTimeout(timer);
          var usable = response && (response.type === 'opaque' || response.ok);
          if (usable) samples.push(nowMs() - started);
          next();
        }, function () {
          if (settled) return;
          settled = true;
          self.clearTimeout(timer);
          next();
        });
      }

      next();
    });
  }

  function race() {
    var tasks = CONFIG.providers.map(function (provider) {
      return sampleProvider(provider).then(function (rtt) {
        return { id: provider.id, rtt: rtt };
      });
    });

    return Promise.all(tasks).then(function (results) {
      var reachable = results.filter(function (item) {
        return isFinite(item.rtt);
      });

      if (!reachable.length) {
        // 全部超时：不写入偏好，保持默认优先级，避免把站点钉死在最差线路上
        log('所有线路探测失败，沿用默认顺序');
        return null;
      }

      reachable.sort(function (a, b) { return a.rtt - b.rtt; });

      var chain = reachable.map(function (item) { return item.id; });
      results.forEach(function (item) {
        // 不可达线路排在链尾，作为"其它线路全挂"时的兜底
        if (chain.indexOf(item.id) === -1) chain.push(item.id);
      });

      var pref = {
        chain: chain,
        ts: Date.now(),
        rtt: Math.round(reachable[0].rtt)
      };

      writePref(pref);
      log('最优线路 ' + chain[0] + '（约 ' + pref.rtt + 'ms），优先链：' + chain.join(' > '));
      return pref;
    });
  }

  /* ---------------- Service Worker 注册 ---------------- */

  function registerSw() {
    var container = navigator.serviceWorker;
    if (!container || !container.register) return;

    function register() {
      container.register(CONFIG.swUrl, {
        scope: CONFIG.swScope,
        // 避免 SW 脚本本身被 HTTP 缓存钉死，导致部署后长时间不更新
        updateViaCache: 'none'
      }).catch(function (error) {
        log('Service Worker 注册失败：', error);
      });
    }

    if (document.readyState === 'complete') {
      register();
    } else {
      self.addEventListener('load', register);
    }

    if (container.addEventListener) {
      container.addEventListener('controllerchange', function () {
        // SW 刚接管页面：把已存偏好补发给它
        var pref = readPref();
        if (pref) notify(pref);
      });
    }
  }

  /* ---------------- 启动 ---------------- */

  function bootstrap() {
    var connection = navigator.connection;
    if (connection && connection.saveData) {
      // 省流量模式：不再额外发探测请求，直接沿用默认顺序
      return;
    }

    var stored = readPref();
    if (isFresh(stored)) {
      notify(stored);
      return;
    }

    race().then(function (pref) {
      if (pref) notify(pref);
    }, noop);
  }

  bootstrap();
  registerSw();

  // 调试入口：cdnRace.clear() 清空偏好，cdnRace.race() 立即重测
  self.cdnRace = {
    config: CONFIG,
    read: readPref,
    race: function () {
      return race().then(function (pref) {
        if (pref) notify(pref);
        return pref;
      });
    },
    clear: function () {
      try {
        self.localStorage.removeItem(CONFIG.prefKey);
      } catch (error) {
        // ignore
      }
    }
  };
})();
