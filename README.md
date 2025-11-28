## 📌 Utilisation du Smooth Scroll

Le Smooth Scroll peut être utilisé de deux manières : **avec les valeurs par défaut** ou **avec des paramètres personnalisés**.

---

### 1️⃣ Version par défaut

Pour activer le scroll fluide avec toutes les valeurs par défaut, il suffit de faire :

```html
<script type="module">
import initSmoothScroll from "https://cdn.jsdelivr.net/gh/alexandre-maignan/tools/smooth-scroll.js";

initSmoothScroll({
    ease: 0.1,             // vitesse du lissage du scroll (plus haut = plus rapide)
    scrollMult: 1,         // intensité de la molette (1 = normal)

    MOBILE_BREAKPOINT: 768,     // désactive le script sous 768px (mobile)
    minPageHeightRatio: 1.05,   // désactive si page trop petite

    DEBUG: false,               // active les logs console si besoin
});
</script>

```
