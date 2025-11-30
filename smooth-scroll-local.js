// smooth-scroll.js
export function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: false,
        MOBILE_BREAKPOINT: 768,
        ease: 0.03,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        ...options
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;

    // pointer / mouse state
    let pointerDown = false;
    let draggingScrollbar = false;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => SmoothConfig.DEBUG && console.log('[smooth]', ...args);

    const docEl = document.documentElement;
    const getMaxScroll = () =>
        Math.max(document.body.scrollHeight, docEl.scrollHeight) - window.innerHeight;

    // compute scrollbar width (may be 0 on some platforms)
    const getScrollbarWidth = () => Math.max(0, window.innerWidth - docEl.clientWidth);

    function updateScrollBehavior() {
        const behavior = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT ? "" : "auto";
        docEl.style.scrollBehavior = behavior;
        document.body.style.scrollBehavior = behavior;
    }

    function enableSmooth() {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = target = window.scrollY;
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        log('Smooth enabled');
    }

    function disableSmooth() {
        if (!smoothEnabled) return;
        smoothEnabled = false;
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
        cancelAnimationFrame(rafId);
        rafId = null;
        log('Smooth disabled');
    }

    // --- Robust scrollbar drag detection ---
    // We'll listen to pointerdown/mousedown and use clientX vs clientWidth to decide.
    function onPointerDown(e) {
        pointerDown = true;
        draggingScrollbar = false;

        // small tolerance in px to account for fractional layouts and overlays
        const tolerance = 2;
        const sbWidth = getScrollbarWidth();
        const clientWidth = docEl.clientWidth;

        // If event.clientX is in the region of the scrollbar (right edge)
        if (typeof e.clientX === 'number' && sbWidth > 0) {
            if (e.clientX >= clientWidth - tolerance) {
                // very likely clicked the native scrollbar
                draggingScrollbar = true;
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        // If the pointerdown did not fire for scrollbar (some browsers),
        // we attach a temporary mousemove to detect pointer moving into scrollbar zone while pressed.
        // This listener is removed on pointerup.
        function tempMove(ev) {
            if (!pointerDown) return;
            if (typeof ev.clientX !== 'number') return;
            const sbWidth2 = getScrollbarWidth();
            if (sbWidth2 <= 0) return;

            if (ev.clientX >= (docEl.clientWidth - 2)) {
                draggingScrollbar = true;
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        window.addEventListener('mousemove', tempMove, { passive: true });

        // cleanup function to remove the temporary move listener
        const cleanup = () => {
            window.removeEventListener('mousemove', tempMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('mouseup', onPointerUp);
        };

        // ensure cleanup after pointerup/mouseup
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('mouseup', onPointerUp);

        function onPointerUp() {
            pointerDown = false;
            draggingScrollbar = false;
            current = target = window.scrollY;
            cleanup();
        }
    }

    // Attach both pointerdown and mousedown for compatibility
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('mousedown', onPointerDown, { passive: true });

    // Also ensure pointerup/mouseup clear state even if onPointerDown didn't run
    window.addEventListener('pointerup', () => {
        pointerDown = false;
        draggingScrollbar = false;
        current = target = window.scrollY;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        pointerDown = false;
        draggingScrollbar = false;
        current = target = window.scrollY;
    }, { passive: true });

    // legacy support: if someone uses touch
    window.addEventListener('touchstart', () => {
        pointerDown = true;
        draggingScrollbar = false;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        pointerDown = false;
        draggingScrollbar = false;
        current = target = window.scrollY;
    }, { passive: true });

    // --- Wheel override ---
    function onWheel(e) {
        if (!smoothEnabled || draggingScrollbar || e.ctrlKey) return;
        e.preventDefault();
        const maxScroll = getMaxScroll();
        target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);
        if (!rafId) render();
    }

    function onNativeScroll() {
        // If there is no smooth RAF ongoing (rafId null) OR user is dragging scrollbar,
        // sync positions to native scroll position to avoid jumps.
        if (!rafId || draggingScrollbar) {
            current = target = window.scrollY;
        }
    }

    const keyboardScrollKeys = new Set([
        "ArrowUp", "ArrowDown", "PageUp",
        "PageDown", "Home", "End", "Space"
    ]);

    window.addEventListener("keydown", (e) => {
        if (!keyboardScrollKeys.has(e.code)) return;
        cancelAnimationFrame(rafId);
        rafId = null;
        current = target = window.scrollY;
    });

    function render() {
        if (!smoothEnabled || draggingScrollbar) return;
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
        const pageHeight = Math.max(document.body.scrollHeight, docEl.scrollHeight);
        const shouldDisable =
            pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio ||
            window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT;
        shouldDisable ? disableSmooth() : enableSmooth();
    }

    function initAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return;
                const targetEl = document.querySelector(this.getAttribute('href'));
                if (!targetEl) return;
                e.preventDefault();
                cancelAnimationFrame(rafId);
                rafId = null;
                current = target = window.scrollY;
                // offsetTop is faster and consistent for anchors
                target = targetEl.offsetTop;
                render();
            });
        });
    }

    updateScrollBehavior();
    checkDevice();
    initAnchors();

    window.addEventListener("resize", () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(() => {
            updateScrollBehavior();
            checkDevice();
        }, 120);
    });
}
