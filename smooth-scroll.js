window.SmoothScroll = (function () {

    function init(options = {}) {

        const SmoothConfig = {
            DEBUG: false,
            MOBILE_BREAKPOINT: 768,
            ease: 0.1,
            scrollMult: 1,
            stopThreshold: 0.1,
            minPageHeightRatio: 1.05,
            ...options
        };

        let enabled = false;
        let current = 0;
        let target = 0;
        let rafId = null;

        const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
        const log = (...args) => SmoothConfig.DEBUG && console.log('[smooth]', ...args);

        /* -----------------------------------------
            Update scroll-behavior
        ------------------------------------------*/
        function updateScrollBehavior() {
            const behavior = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT ? "" : "auto";
            document.documentElement.style.scrollBehavior = behavior;
            document.body.style.scrollBehavior = behavior;
        }

        /* -----------------------------------------
            Enable / Disable
        ------------------------------------------*/
        function enable() {
            if (enabled) return;
            enabled = true;

            current = target = window.scrollY;

            window.addEventListener("wheel", onWheel, { passive: false });
            window.addEventListener("scroll", syncScroll, { passive: true });

            log("Smooth enabled");
        }

        function disable() {
            if (!enabled) return;
            enabled = false;

            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("scroll", syncScroll);

            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;

            log("Smooth disabled");
        }

        /* -----------------------------------------
            Mouse wheel scroll
        ------------------------------------------*/
        function onWheel(e) {
            if (e.ctrlKey) return;

            e.preventDefault();

            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);

            if (!rafId) render();
        }

        function syncScroll() {
            if (!rafId) current = target = window.scrollY;
        }

        /* -----------------------------------------
            Animation
        ------------------------------------------*/
        function render() {
            if (!enabled) return;

            const diff = target - current;

            if (Math.abs(diff) < SmoothConfig.stopThreshold) {
                current = target;
                rafId = null;
                return;
            }

            current += diff * SmoothConfig.ease;
            window.scrollTo(0, Math.round(current));

            rafId = requestAnimationFrame(render);
        }

        /* -----------------------------------------
            Conditions device / page size
        ------------------------------------------*/
        function checkState() {
            const isMobile = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT;
            const pageTooShort = document.documentElement.scrollHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio;

            if (isMobile || pageTooShort) {
                disable();
                return;
            }

            enable();
        }

        /* -----------------------------------------
            Internal anchor links
        ------------------------------------------*/
        function setupAnchors() {
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener("click", e => {
                    const el = document.querySelector(a.getAttribute("href"));
                    if (!el) return;

                    if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return;

                    e.preventDefault();
                    if (rafId) cancelAnimationFrame(rafId);

                    current = target = window.scrollY;
                    target = el.getBoundingClientRect().top + window.scrollY;

                    render();
                });
            });
        }

        /* -----------------------------------------
            Init
        ------------------------------------------*/
        updateScrollBehavior();
        checkState();
        setupAnchors();

        window.addEventListener("resize", () => {
            clearTimeout(window.__smoothResizeTimer);
            window.__smoothResizeTimer = setTimeout(() => {
                updateScrollBehavior();
                checkState();
            }, 120);
        });
    }

    return { init };
})();
