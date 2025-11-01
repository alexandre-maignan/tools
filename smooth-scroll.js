document.addEventListener('DOMContentLoaded', () => {

let current = 0;
    let target = 0;
    let rafId = null;
    const ease = 0.10;
    const scrollMult = 1;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

    // Bloquer la restauration automatique de scroll
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Forcer le scroll en haut après le chargement
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
        current = 0;
        target = 0;
    });

    // Met à jour target lors du scroll natif
    window.addEventListener('scroll', () => {
        if (!rafId) current = target = window.scrollY;
    }, { passive: true });

    // Scroll fluide à la molette
    window.addEventListener('wheel', e => {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();

        const maxScroll = Math.max(
  document.body.scrollHeight,
  document.documentElement.scrollHeight
) - window.innerHeight;
        target = clamp(target + e.deltaY * scrollMult, 0, maxScroll);

        if (!rafId) render();
    }, { passive: false });

    function render() {
        const diff = target - current;
        if (Math.abs(diff) < 0.1) {
            current = target;
            rafId = null;
            return;
        }

        current += diff * ease;
        window.scrollTo(0, current);

        rafId = requestAnimationFrame(render);
    }

    // Suivi du scroll lors d'une sélection
    document.addEventListener('selectionchange', () => {
        if (!window.getSelection().isCollapsed) target = window.scrollY;
    });

    // Pause si onglet non visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        } else if (!document.hidden && target !== window.scrollY && !rafId) {
            render();
        }
    });


    });

