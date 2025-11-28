/**
 * Smooth Scroll Module
 * @version 1.0
 * @author 
 */
export default function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: true,
        MOBILE_BREAKPOINT: 768,
        ease: 0.12,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        ...options // Merge options personnalisées
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;
    let prevScrollBehavior = null;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    function disableCssSmooth() {
        prevScrollBehavior = document.documentElement.style.scrollBehavior || '';
        document.documentElement.style.scrollBehavior = 'auto';
        log('CSS scroll-behavior forcé à auto');
    }

    function restoreCssSmooth() {
        document.documentElement.style.scrollBehavior = prevScrollBehavior;
        log('CSS scroll-behavior restauré');
    }

    function enableSmooth() {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = window.scrollY;
        target = window.scrollY;
        disableCssSmooth();
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
        restoreCssSmooth();
        log('Smooth disabled');
    }

    function onWheel(e) {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= window.innerHeight;

        const maxScroll = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        ) - window.innerHeight;

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
        try {
            window.scrollTo({ top: Math.round(current), left: 0, behavior: 'auto' });
        } catch {
            window.scrollTo(0, Math.round(current));
        }
        rafId = requestAnimationFrame(render);
    }

    function checkDevice() {
        const pageHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio) return disableSmooth();
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return disableSmooth();
        enableSmooth();
    }

    window.addEventListener('resize', () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(checkDevice, 120);
    });

    checkDevice();

    if (SmoothConfig.DEBUG) {
        window.__Smooth = {
            enable: enableSmooth,
            disable: disableSmooth,
            config: SmoothConfig,
            status: () => ({ smoothEnabled, current, target })
        };
        log('API debug disponible via window.__Smooth');
    }
}
