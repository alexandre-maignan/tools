// smoothScroll.js
/**
 * Smooth Scroll sans module — version exportable pour GitHub
 * Compatible avec les liens vers des ancres
 */
export function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: false,
        MOBILE_BREAKPOINT: 768,
        ease: 0.06,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        offset: 0, // décalage pour la navbar
        ...options
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    function enableSmooth() {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = window.scrollY;
        target = window.scrollY;

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        log('Smooth enabled');
    }

    function disableSmooth() {
        if (!smoothEnabled) return;
        smoothEnabled = false;
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        log('Smooth disabled (mobile ou page courte)');
    }

    function onWheel(e) {
        // Laisser le zoom natif si Ctrl est pressé
        if (e.ctrlKey) return;

        e.preventDefault();
        let delta = e.deltaY;
        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        target = clamp(target + delta * SmoothConfig.scrollMult, 0, maxScroll);
        if (!rafId) render();
    }

    function onNativeScroll() {
        if (!rafId) target = current = window.scrollY;
    }

    function render() {
        if (!smoothEnabled) return;
        const diff = target - current;
        if (Math.abs(diff) < SmoothConfig.stopThreshold) {
            current = target;
            rafId = null;
            return;
        }
        current += diff * SmoothConfig.ease;
        window.scrollTo({ top: Math.round(current), behavior: "auto" });
        rafId = requestAnimationFrame(render);
    }

    function checkDevice() {
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio) {
            disableSmooth();
            return;
        }
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            disableSmooth(); // JS smooth désactivé sur mobile
            return;
        }
        enableSmooth();
    }

    checkDevice();
    window.addEventListener("resize", () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(checkDevice, 120);
    });

    // Liens vers des ancres internes
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                current = target = window.scrollY;
                const topPos = targetEl.getBoundingClientRect().top + window.scrollY - SmoothConfig.offset;
                window.scrollTo({ top: topPos, behavior: "smooth" });
            }
        });
    });

    return { disable: disableSmooth };
}


