/* smooth-scroll.js
   Robust version: exposes SmoothScroll.init, .enable, .disable, .setOptions
   Supports data-* config and auto-init when <script data-auto-init="true"> is used.
*/
(function (global) {
  const NAME = 'SmoothScroll';
  if (global[NAME]) {
    // don't overwrite existing
    console.warn(`${NAME} already defined — skipping redefinition.`);
    return;
  }

  function createInstance() {
    let config = {
      DEBUG: false,
      MOBILE_BREAKPOINT: 768,
      ease: 0.1,
      scrollMult: 1,
      stopThreshold: 0.1,
      minPageHeightRatio: 1.05,
    };

    let enabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;

    const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
    const log = (...args) => config.DEBUG && console.log('[smooth]', ...args);

    function updateScrollBehavior() {
      const behavior = window.innerWidth < config.MOBILE_BREAKPOINT ? "" : "auto";
      try {
        document.documentElement.style.scrollBehavior = behavior;
        document.body.style.scrollBehavior = behavior;
      } catch (err) {
        log('updateScrollBehavior error', err);
      }
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      current = target = window.scrollY;
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("scroll", syncScroll, { passive: true });
      log('enabled', config);
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", syncScroll);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      log('disabled');
    }

    function onWheel(e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      target = clamp(target + e.deltaY * config.scrollMult, 0, maxScroll);
      if (!rafId) render();
    }

    function syncScroll() {
      if (!rafId) current = target = window.scrollY;
    }

    function render() {
      if (!enabled) return;
      const diff = target - current;
      if (Math.abs(diff) < config.stopThreshold) {
        current = target;
        rafId = null;
        return;
      }
      current += diff * config.ease;
      window.scrollTo(0, Math.round(current));
      rafId = requestAnimationFrame(render);
    }

    function checkState() {
      const isMobile = window.innerWidth < config.MOBILE_BREAKPOINT;
      const pageTooShort = document.documentElement.scrollHeight <= window.innerHeight * config.minPageHeightRatio;
      if (isMobile || pageTooShort) {
        disable();
      } else {
        enable();
      }
    }

    function setupAnchors() {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const href = a.getAttribute('href');
          if (!href || href.length === 1) return;
          const el = document.querySelector(href);
          if (!el) return;
          if (window.innerWidth < config.MOBILE_BREAKPOINT) return;
          e.preventDefault();
          if (rafId) cancelAnimationFrame(rafId);
          current = target = window.scrollY;
          target = el.getBoundingClientRect().top + window.scrollY;
          render();
        });
      });
    }

    function setOptions(newOpts = {}) {
      config = { ...config, ...newOpts };
      log('options updated', config);
    }

    function init(options = {}) {
      setOptions(options);
      updateScrollBehavior();
      checkState();
      setupAnchors();
      window.addEventListener('resize', () => {
        clearTimeout(window.__smoothResizeTimer);
        window.__smoothResizeTimer = setTimeout(() => {
          updateScrollBehavior();
          checkState();
        }, 120);
      });
      // return instance for chaining
      return instance;
    }

    const instance = {
      init,
      enable,
      disable,
      setOptions,
      _getConfig: () => ({ ...config }), // debug helper
    };

    return instance;
  }

  const smooth = createInstance();
  global[NAME] = smooth;

  // Auto-init if script tag includes data-auto-init="true"
  try {
    const scripts = document.getElementsByTagName('script');
    const currentScript = document.currentScript || scripts[scripts.length - 1];
    if (currentScript) {
      const auto = currentScript.getAttribute('data-auto-init');
      if (auto === 'true') {
        // collect data-* options
        const opts = {};
        if (currentScript.dataset.ease) opts.ease = parseFloat(currentScript.dataset.ease);
        if (currentScript.dataset.scrollMult) opts.scrollMult = parseFloat(currentScript.dataset.scrollMult);
        if (currentScript.dataset.debug) opts.DEBUG = currentScript.dataset.debug === 'true';
        if (currentScript.dataset.breakpoint) opts.MOBILE_BREAKPOINT = parseInt(currentScript.dataset.breakpoint, 10);
        // init after DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => smooth.init(opts));
        } else {
          smooth.init(opts);
        }
      }
    }
  } catch (err) {
    // silent
    console.error('SmoothScroll auto-init error', err);
  }

})(window);


