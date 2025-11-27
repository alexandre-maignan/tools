export default function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: false,
        MOBILE_BREAKPOINT: 768,
        ease: 0.03,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        offset: 100,
        ...options
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    // ------------------------------
    // Forcer ou laisser scroll-behavior selon largeur
    // ------------------------------
    function updateScrollBehavior() {
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            document.documentElement.style.scrollBehavior = "";
            document.body.style.scrollBehavior = "";
        } else {
            document.documentElement.style.scrollBehavior = "auto";
            document.body.style.scrollBehavior = "auto";
        }
    }

    // ------------------------------
    // Activation/désactivation du scroll fluide
    // ------------------------------
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

    // ------------------------------
    // Gestion du scroll par molette
    // ------------------------------
    function onWheel(e) {
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

    // ------------------------------
    // Animation du scroll fluide
    // ------------------------------
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

    // ------------------------------
    // Vérification du device / taille de page
    // ------------------------------
    function checkDevice() {
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio) {
            disableSmooth();
            return false;
        }
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            disableSmooth();
            return false;
        }
        enableSmooth();
        return true;
    }

    // ------------------------------
    // Initialisation
    // ------------------------------
    updateScrollBehavior();
    checkDevice();

    window.addEventListener("resize", () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(() => {
            updateScrollBehavior();
            checkDevice();
        }, 120);
    });

    // ------------------------------
    // Gestion des liens vers des ancres internes
    // ------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
                return;
            }

            e.preventDefault();
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            current = target = window.scrollY;
            target = targetEl.getBoundingClientRect().top + window.scrollY - SmoothConfig.offset;
            if (!rafId) render();
        });
    });
}
