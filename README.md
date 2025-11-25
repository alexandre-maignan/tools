## 📌 Utilisation du Smooth Scroll

Le Smooth Scroll peut être utilisé de deux manières : **avec les valeurs par défaut** ou **avec des paramètres personnalisés**.

---

### 1️⃣ Version par défaut

Pour activer le scroll fluide avec toutes les valeurs par défaut, il suffit de faire :

```html
<script type="module">
  import initSmoothScroll from 'https://alexandre-maignan.github.io/tools/smooth-scroll.js';

  // Initialisation simple avec les valeurs par défaut
  initSmoothScroll();
</script>

```

### 2️⃣ Version avec paramètres


```html
<script type="module">
  import { initSmoothScroll } from 'https://alexandre-maignan.github.io/tools/smooth-scroll.js';

  initSmoothScroll({
    DEBUG: true,             // affiche les logs dans la console
    ease: 0.08,              // vitesse du scroll
    scrollMult: 1.2,         // intensité du scroll
    MOBILE_BREAKPOINT: 768,  // désactive le scroll sur mobile
    offset: 150,             // décalage des ancrages pour s'ajuster si il y a une navbar fixe
  });
</script>
```




