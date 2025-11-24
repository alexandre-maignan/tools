Version par défaut 
-------------------------
<script type="module">
  import initSmoothScroll from 'https://alexmaignan95-ai.github.io/tools/smooth-scroll.js';
</script>


Version avec paramètres
-------------------------
<script type="module">
  import initSmoothScroll from 'https://alexmaignan95-ai.github.io/tools/smooth-scroll.js';

  initSmoothScroll({
    DEBUG: true,       // affiche les logs dans la console
    ease: 0.15,        // vitesse du scroll
    scrollMult: 1.2,   // intensité du scroll
    MOBILE_BREAKPOINT: 768 // désactive sur mobile
  });
</script>
