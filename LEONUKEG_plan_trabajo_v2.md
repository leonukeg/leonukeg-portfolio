# LEONUKEG PORTFOLIO — PLAN DE TRABAJO v2.0
### Stack: HTML · CSS · JavaScript (Vanilla + GSAP)
### Para: Antigravity

> Construimos primero en HTML/CSS/JS puro para validar la experiencia visual rápido y sin fricción.
> Cuando el resultado esté exactamente como se quiere, se porta a Reflex (Python).
> **Un bloque a la vez. No avanzar sin validar el anterior.**

---

## CONTEXTO RÁPIDO

**Quién:** Freddy León / LEONUKEG — Fullstack Developer, SaaS, Logística, Data, AI.
**Qué:** Portfolio inmersivo. No es una página web tradicional. Es un sistema vivo.
**Referencia completa de identidad:** `LEONUKEG_whitepaper_v2.md`

---

## STACK DEFINITIVO

```
HTML5             → estructura semántica
CSS3              → variables, animaciones, layout
JavaScript Vanilla → lógica, Canvas 2D, Web Worker, IntersectionObserver
GSAP (CDN)        → animaciones de entrada y transiciones entre capas
Google Fonts      → Space Grotesk + IBM Plex Mono
```

**Sin frameworks JS. Sin bundlers. Sin build steps.**
Un solo `index.html` + archivos `.css` y `.js` separados. Abre en el browser y funciona.

---

## ESTRUCTURA DE ARCHIVOS

```
leonukeg/
├── index.html
├── css/
│   ├── reset.css          ← reset + variables CSS
│   ├── layout.css         ← estructura de capas y secciones
│   ├── hud.css            ← HUD fijo en esquinas
│   ├── typography.css     ← sistema tipográfico
│   └── sections/
│       ├── entry.css
│       ├── system.css
│       ├── work.css
│       ├── lab.css
│       └── signals.css
├── js/
│   ├── main.js            ← init, scroll detection, coordinación
│   ├── lightning.js       ← render Canvas 2D (hilo principal)
│   ├── lightning.worker.js← Web Worker con el algoritmo de rayos
│   └── hud.js             ← actualización de coordenadas y estado HUD
└── assets/
    └── favicon.ico
```

---

## PALETA — VARIABLES CSS

```css
:root {
  --abismo:   #050816;   /* fondo base — NUNCA negro puro */
  --petroleo: #0f2f2f;   /* fondo secundario */
  --teal:     #1D9E75;   /* acento principal */
  --teal-dim: #0F6E56;   /* teal oscuro */
  --teal-lt:  #5DCAA5;   /* teal claro */
  --red:      #7B1B1C;   /* acento emocional */
  --copper:   #D85A30;   /* acento secundario */
  --text:     #E8E4D8;   /* texto principal — NUNCA blanco puro */
  --muted:    #888780;   /* texto secundario */
}
```

---

## TIPOGRAFÍA

```css
/* Importar en <head> */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

--font-editorial: 'Space Grotesk', sans-serif;   /* heroes, títulos */
--font-technical: 'IBM Plex Mono', monospace;    /* HUD, labels, código */
```

---
---

# BLOQUES DE TRABAJO

---

## BLOQUE 1 — MOTOR DE RAYOS (LIGHTNING BG)
### `estado: PENDIENTE` · Prioridad: CRÍTICA

> El fondo vivo. Todo lo demás se construye encima.
> Validar este bloque antes de tocar HTML de contenido.

---

### 1.1 · Web Worker — `lightning.worker.js`

**Clase Segment:**
```javascript
{
  x1, y1, x2, y2,   // coordenadas
  width,             // grosor (0.6 – 2.2)
  life,              // frames restantes
  maxLife,           // frames totales de vida
  depth,             // profundidad de bifurcación
  colorIdx,          // 0-5 → mapea a paleta
}
```

**Función `buildBolt(ox, oy, angle, length, width, life, branchProb, depth)`:**
```
maxDepth = 8
minLength = 5
steps = random(4, 10)
stepLen = length / steps

para cada step:
  deviate = random(-0.55, 0.55)
  curAngle = angle + deviate
  nx = x + cos(curAngle) * stepLen * random(0.7, 1.3)
  ny = y + sin(curAngle) * stepLen * random(0.7, 1.3)

  guardar Segment con depth y colorIdx asignado según depth:
    depth 0-2 → colorIdx random entre [0, 1, 2]   (teal vivo, teal claro, teal dim)
    depth 3-5 → colorIdx random entre [1, 3, 4]   (teal claro, rojo, cobre)
    depth 6+  → colorIdx = 2                       (teal oscuro, baja opacity)

  si random() < branchProb:
    bAngle = curAngle ± random(0.4, 1.1)
    llamar buildBolt recursivo con depth+1, length*random(0.35,0.65)

  x = nx, y = ny
```

**Función `spawnCycle(W, H)`:**
```
count = random(8, 14)             // rayos simultáneos
origin = { x: W/2, y: H/2 }

para cada rayo:
  angle  = random(0, 2π)          // todas las direcciones
  length = random(W*0.5, W*1.1)   // hasta cruzar la pantalla
  width  = random(0.6, 2.2)
  life   = random(4, 10)
  branchProb = random(0.50, 0.78) // alta → densidad

  segments.push(...buildBolt(origin.x, origin.y, ...))
```

**Loop del Worker:**
```javascript
// Recibe del hilo principal:
// { type: 'init', W, H }
// { type: 'resize', W, H }

// Cada ~16ms (60fps target):
step()          // reduce life, elimina muertos
si random() < 0.82: spawnCycle()
postMessage({ segments })
```

---

### 1.2 · Canvas render — `lightning.js`

**Setup:**
```javascript
const canvas = document.getElementById('lightning');
const ctx = canvas.getContext('2d');
canvas.style.cssText = `
  position: fixed; top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 0; pointer-events: none;
`;

// Tamaño real en píxeles
canvas.width  = window.innerWidth  * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
ctx.scale(devicePixelRatio, devicePixelRatio);
```

**Paleta de colores (array indexado por colorIdx):**
```javascript
const COLORS = [
  '#1D9E75',  // 0 teal vivo
  '#5DCAA5',  // 1 teal claro
  '#0F6E56',  // 2 teal oscuro
  '#7B1B1C',  // 3 rojo sangre
  '#D85A30',  // 4 cobre
  '#E8E4D8',  // 5 blanco cálido (solo núcleo)
];
const GLOW = 'rgba(29, 158, 117, ';
```

**Función `render(segments)`:**
```
1. FADE TRAIL
   ctx.fillStyle = 'rgba(5, 8, 22, 0.80)'
   ctx.fillRect(0, 0, W, H)

2. SEGMENTOS
   para cada seg en segments:
     alpha = seg.life / seg.maxLife

     si seg.depth < 3:
       // halo exterior
       ctx.strokeStyle = GLOW + (alpha * 0.15) + ')'
       ctx.lineWidth = seg.width * 4
       dibujar línea

     // línea principal
     ctx.strokeStyle = COLORS[seg.colorIdx]
     ctx.globalAlpha = alpha * random(0.65, 1.0)   // shimmer
     ctx.lineWidth = seg.width
     ctx.lineCap = 'round'
     dibujar línea
     ctx.globalAlpha = 1

3. NÚCLEO CENTRAL
   const pulse = Math.sin(Date.now() * 0.004) * 5

   corona:  arc r=22+pulse, rgba(29,158,117, 0.06)
   glow:    arc r=13+pulse, rgba(29,158,117, 0.18)
   cuerpo:  arc r=5,        #E8E4D8, opacity 0.95
   punto:   arc r=2,        #ffffff, opacity 1.0
```

**Recibir datos del Worker:**
```javascript
const worker = new Worker('./js/lightning.worker.js');
worker.onmessage = ({ data }) => {
  requestAnimationFrame(() => render(data.segments));
};
worker.postMessage({ type: 'init', W: innerWidth, H: innerHeight });
```

**ResizeObserver:**
```javascript
new ResizeObserver(() => {
  canvas.width  = innerWidth  * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  worker.postMessage({ type: 'resize', W: innerWidth, H: innerHeight });
}).observe(document.body);
```

---

### ✅ CRITERIOS DE VALIDACIÓN — BLOQUE 1

- [ ] Mínimo 8 rayos activos simultáneamente en todo momento
- [ ] Los rayos alcanzan o superan los bordes de la pantalla
- [ ] Ningún rayo es igual a otro — forma, bifurcaciones y color varían
- [ ] Los colores son exactamente los de la paleta (teal + rojo + cobre)
- [ ] Fondo `#050816` — no negro puro
- [ ] La estela de fade es atmosférica — los rayos muertos dejan rastro
- [ ] El núcleo central pulsa suavemente y siempre es visible
- [ ] **55fps mínimo en desktop** — verificar con DevTools Performance
- [ ] El hilo principal no se bloquea (Web Worker corriendo separado)

---
---

## BLOQUE 2 — ENTRY LAYER
### `estado: BLOQUEADO — espera Bloque 1`

> Primera pantalla completa. Canvas de fondo + identidad LEONUKEG encima.

---

### 2.1 · HTML base

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEONUKEG — Freddy León</title>
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
  <!-- CSS -->
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/typography.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/hud.css">
  <link rel="stylesheet" href="css/sections/entry.css">
</head>
<body>

  <!-- CANVAS FIJO — FONDO VIVO -->
  <canvas id="lightning"></canvas>

  <!-- HUD — SIEMPRE VISIBLE -->
  <div id="hud">
    <span id="hud-tl">LEONUKEG</span>
    <span id="hud-tr">NEURAL NET ACTIVE</span>
    <span id="hud-bl">SYSTEM ONLINE</span>
    <span id="hud-br" id="coords">X: 0.000 · Y: 0.000</span>
    <nav id="scroll-index">
      <span class="idx active">01</span>
      <span class="idx">02</span>
      <span class="idx">03</span>
      <span class="idx">04</span>
      <span class="idx">05</span>
    </nav>
  </div>

  <!-- CONTENIDO SCROLLABLE -->
  <main>

    <section id="entry">
      <div class="entry-content">
        <p class="label">MATHEMATICIAN · FULLSTACK DEVELOPER</p>
        <h1 class="hero-name">LEONUKEG</h1>
        <p class="hero-sub">Freddy León</p>
        <h2 class="hero-tagline">
          Turning complexity into<br>
          <em>elegant systems.</em>
        </h2>
        <p class="scroll-hint">_ scroll to explore</p>
      </div>
    </section>

    <section id="system"><!-- Bloque 4 --></section>
    <section id="work"><!-- Bloque 4 --></section>
    <section id="lab"><!-- Bloque 5 --></section>
    <section id="signals"><!-- Bloque 5 --></section>

  </main>

  <!-- SCRIPTS -->
  <script src="js/lightning.js" type="module"></script>
  <script src="js/hud.js" type="module"></script>
  <script src="js/main.js" type="module"></script>

</body>
</html>
```

---

### 2.2 · CSS Entry Layer

```css
/* reset.css */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: auto; }   /* NO smooth — scroll nativo */
body { background: var(--abismo); color: var(--text); overflow-x: hidden; }

/* entry.css */
#entry {
  height: 100vh;
  display: flex;
  align-items: center;
  padding: 0 52px;
  pointer-events: none;   /* el canvas recibe los eventos */
  position: relative;
  z-index: 5;
}

.label {
  font-family: var(--font-technical);
  font-size: 10px;
  color: var(--teal);
  letter-spacing: 0.18em;
  margin-bottom: 18px;
  opacity: 0;   /* GSAP lo anima */
}

.hero-name {
  font-family: var(--font-editorial);
  font-size: clamp(56px, 8vw, 96px);
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 0 60px rgba(5,8,22,0.8);
  opacity: 0;
}

.hero-sub {
  font-family: var(--font-editorial);
  font-size: 28px;
  color: var(--muted);
  margin-bottom: 24px;
  opacity: 0;
}

.hero-tagline {
  font-family: var(--font-editorial);
  font-size: clamp(28px, 3.5vw, 42px);
  font-weight: 500;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 48px;
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
  opacity: 0;
}

.hero-tagline em {
  font-style: normal;
  color: var(--red);
  font-weight: 700;
}

.scroll-hint {
  font-family: var(--font-technical);
  font-size: 11px;
  color: #4a4a4a;
  letter-spacing: 0.22em;
  opacity: 0;
  animation: blink 2.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
```

---

### 2.3 · HUD CSS

```css
/* hud.css */
#hud { position: fixed; inset: 0; z-index: 10; pointer-events: none; }

#hud-tl, #hud-tr, #hud-bl, #hud-br {
  position: absolute;
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  letter-spacing: 0.12em;
  opacity: 0.35;
}

#hud-tl { top: 14px; left: 18px; }
#hud-tr { top: 14px; right: 18px; }
#hud-bl { bottom: 14px; left: 18px; }
#hud-br { bottom: 14px; right: 18px; }

#scroll-index {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.idx {
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  opacity: 0.2;
  letter-spacing: 0.1em;
  transition: opacity 0.4s ease;
}

.idx.active { opacity: 1; }
```

---

### 2.4 · Animación de entrada — GSAP

```javascript
// En main.js, después de que el DOM carga:
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({ delay: 0.3 });
tl.to('.label',       { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
  .to('.hero-name',   { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.3')
  .to('.hero-sub',    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4')
  .to('.hero-tagline',{ opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.3')
  .to('.scroll-hint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '+=0.4');

// Todos los elementos empiezan con transform: translateY(20px) en CSS
```

---

### ✅ CRITERIOS DE VALIDACIÓN — BLOQUE 2

- [ ] El texto es legible sobre los rayos en todo momento
- [ ] La animación de entrada se siente cinematográfica, no rápida
- [ ] El HUD está presente pero no distrae — muy sutil
- [ ] `_ scroll to explore` parpadea suavemente
- [ ] En 1440px de ancho se ve exactamente como se concibió
- [ ] El conjunto se siente: nocturno · vivo · inteligente

---
---

## BLOQUE 3 — SCROLL + TRANSICIONES
### `estado: BLOQUEADO — espera Bloque 2`

> IntersectionObserver detecta la capa activa. El canvas cambia su modo.
> GSAP maneja las transiciones de contenido.

---

### 3.1 · Detección de sección activa

```javascript
// main.js
const sections = document.querySelectorAll('main section');
const idxItems = document.querySelectorAll('.idx');

const MODE_MAP = {
  'entry':   'CALM',
  'system':  'ACTIVE',
  'work':    'INTENSE',
  'lab':     'STORM',
  'signals': 'CALM',
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
      const id = entry.target.id;
      const idx = [...sections].indexOf(entry.target);

      // Actualizar índice HUD
      idxItems.forEach((el, i) => el.classList.toggle('active', i === idx));

      // Cambiar modo del canvas
      window.lightningSetMode?.(MODE_MAP[id]);
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));
```

---

### 3.2 · Modos del sistema de rayos

El Worker acepta `{ type: 'setMode', mode }` y ajusta parámetros:

```javascript
const MODES = {
  CALM:   { spawnRate: 0.50, countMin: 4,  countMax: 8  },
  ACTIVE: { spawnRate: 0.70, countMin: 6,  countMax: 10 },
  INTENSE:{ spawnRate: 0.85, countMin: 8,  countMax: 14 },
  STORM:  { spawnRate: 0.95, countMin: 12, countMax: 18 },
};
```

La transición entre modos interpola los valores suavemente en ~60 frames.

---

### 3.3 · Alturas de secciones placeholder

```css
#entry   { height: 100vh; }
#system  { height: 100vh; min-height: 600px; }
#work    { height: 200vh; min-height: 1200px; }
#lab     { height: 100vh; min-height: 600px; }
#signals { height: 100vh; min-height: 600px; }
```

---

### ✅ CRITERIOS DE VALIDACIÓN — BLOQUE 3

- [ ] Al scrollear a cada sección, el canvas cambia de comportamiento
- [ ] La transición es suave — sin salto brusco
- [ ] El índice lateral del HUD se actualiza correctamente
- [ ] El scroll es 100% fluido — 0 jank, 0 scroll hijacking

---
---

## BLOQUE 4 — SYSTEM LAYER + WORK LAYER
### `estado: BLOQUEADO — espera Bloque 3` · Prioridad: MEDIA-ALTA

> **Objetivo:** Identidad completa de LEONUKEG + los 6 proyectos como artefactos.
> El canvas ya está en modo ACTIVE → INTENSE al llegar aquí.

---

### 4.1 · System Layer — CSS

Archivo: `css/sections/system.css`

```css
#system {
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  padding: 0 52px;
  position: relative;
  z-index: 5;
}

.system-content {
  max-width: 680px;
  pointer-events: none;
}

.system-h1 {
  font-family: var(--font-editorial);
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.15;
  margin-bottom: 24px;
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
  opacity: 0;
  transform: translateY(20px);
}

.system-body {
  font-family: var(--font-editorial);
  font-size: 18px;
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 40px;
  opacity: 0;
  transform: translateY(20px);
}

.stack-label {
  font-family: var(--font-technical);
  font-size: 10px;
  color: var(--teal);
  letter-spacing: 0.18em;
  margin-bottom: 8px;
  opacity: 0;
}

.stack-line {
  font-family: var(--font-technical);
  font-size: 16px;
  color: var(--teal);
  margin-bottom: 48px;
  opacity: 0;
}

.system-rule {
  width: 100%;
  height: 1px;
  background: rgba(29,158,117,0.15);
  margin: 40px 0;
}

.system-quote {
  border-left: 3px solid var(--red);
  padding-left: 24px;
  margin: 40px 0;
  opacity: 0;
  transform: translateY(20px);
}

.system-quote p {
  font-family: var(--font-editorial);
  font-size: 20px;
  font-style: italic;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 8px;
  text-shadow: 0 0 30px rgba(5,8,22,0.8);
}

.system-quote cite {
  font-family: var(--font-technical);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.12em;
}

.system-statement {
  font-family: var(--font-editorial);
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  opacity: 0;
  transform: translateY(20px);
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
}

.system-statement em {
  font-style: normal;
  color: var(--red);
}
```

---

### 4.2 · System Layer — HTML

```html
<section id="system">
  <div class="system-content">

    <h2 class="system-h1">
      Transformo ideas en<br>productos que funcionan.
    </h2>

    <p class="system-body">
      SaaS de logística. Análisis de datos.<br>
      Interfaces que no complican la vida al usuario.
    </p>

    <p class="stack-label">STACK ────────────────────────────────</p>
    <p class="stack-line">Python · Reflex · SQL/NoSQL · AI/ML</p>

    <div class="system-rule"></div>

    <blockquote class="system-quote">
      <p>"El hombre que pone corazón en lo que hace encuentra soluciones donde normalmente los perezosos e indolentes se dan por vencidos."</p>
      <cite>— Freddy León / LEONUKEG</cite>
    </blockquote>

    <div class="system-rule"></div>

    <p class="system-statement">
      No me interesa lo básico.<br>
      Me interesa construir algo de lo que se pueda hablar<br>
      <em>en una conversación de calle.</em>
    </p>

  </div>
</section>
```

---

### 4.3 · System Layer — animación GSAP (ScrollTrigger)

```javascript
// main.js — añadir después del timeline de Entry

gsap.registerPlugin(ScrollTrigger);

// System layer — elementos entran al hacer scroll
const systemElements = [
  '.system-h1',
  '.system-body',
  '.stack-label',
  '.stack-line',
  '.system-quote',
  '.system-statement',
];

systemElements.forEach((sel, i) => {
  gsap.to(sel, {
    opacity: 1,
    y: 0,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: sel,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
    delay: i * 0.08,
  });
});
```

---

### 4.4 · Work Layer — CSS

Archivo: `css/sections/work.css`

```css
#work {
  height: 200vh;
  min-height: 1200px;
  padding: 80px 52px;
  position: relative;
  z-index: 5;
}

.work-header {
  margin-bottom: 80px;
}

.work-label {
  font-family: var(--font-technical);
  font-size: 10px;
  color: var(--teal);
  letter-spacing: 0.18em;
  margin-bottom: 12px;
  opacity: 0;
}

.work-title {
  font-family: var(--font-editorial);
  font-size: clamp(28px, 3.5vw, 44px);
  font-weight: 700;
  color: var(--text);
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
  opacity: 0;
  transform: translateY(20px);
}

/* ── Proyecto card ── */
.project {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0 32px;
  padding: 36px 0;
  border-top: 1px solid rgba(29,158,117,0.08);
  opacity: 0;
  transform: translateY(24px);
  transition: border-color 0.3s ease;
  cursor: default;
}

.project:hover {
  border-color: rgba(29,158,117,0.25);
}

.project-num {
  font-family: var(--font-technical);
  font-size: 11px;
  color: var(--teal);
  opacity: 0.4;
  padding-top: 4px;
  letter-spacing: 0.1em;
}

.project-body {
  border-left: 2px solid var(--project-accent, var(--teal));
  padding-left: 28px;
  transition: border-color 0.3s ease;
}

.project-name {
  font-family: var(--font-editorial);
  font-size: clamp(22px, 2.5vw, 30px);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
  text-shadow: 0 0 30px rgba(5,8,22,0.8);
}

.project-flagship {
  display: inline-block;
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  border: 1px solid rgba(29,158,117,0.4);
  padding: 2px 8px;
  letter-spacing: 0.12em;
  margin-left: 12px;
  vertical-align: middle;
  border-radius: 2px;
}

.project-desc {
  font-family: var(--font-editorial);
  font-size: 16px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 16px;
}

.project-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.project-meta span {
  font-family: var(--font-technical);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.meta-label {
  color: var(--teal);
}

.meta-value {
  color: var(--muted);
}

.project-status {
  color: var(--project-accent, var(--teal)) !important;
}

/* hover: leve blur en el fondo para sensación de profundidad */
.project:hover .project-body {
  backdrop-filter: blur(1px);
}
```

---

### 4.5 · Work Layer — HTML

```html
<section id="work">
  <div class="work-header">
    <p class="work-label">SELECTED WORKS ─────────────────────────</p>
    <h2 class="work-title">Lo que LEONUKEG ha construido.</h2>
  </div>

  <!-- /01 ALMACEN — FLAGSHIP -->
  <article class="project" style="--project-accent: #1D9E75">
    <span class="project-num">/01</span>
    <div class="project-body">
      <h3 class="project-name">
        ALMACEN
        <span class="project-flagship">FLAGSHIP</span>
      </h3>
      <p class="project-desc">Sistema completo de administración logística. Inventario, entradas/salidas, reportes en tiempo real. El proyecto que más nivel técnico y dominio de negocio demuestra.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · SQL</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">FLAGSHIP PROJECT</span></span>
      </div>
    </div>
  </article>

  <!-- /02 ANALISIS FUTBOL -->
  <article class="project" style="--project-accent: #0F6E56">
    <span class="project-num">/02</span>
    <div class="project-body">
      <h3 class="project-name">ANALISIS FUTBOL</h3>
      <p class="project-desc">Plataforma de estadísticas deportivas. Análisis de datos, visualizaciones y métricas de rendimiento. Donde los datos y el deporte se encuentran.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · Data Analysis</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">EN DESARROLLO</span></span>
      </div>
    </div>
  </article>

  <!-- /03 MATHLAB -->
  <article class="project" style="--project-accent: #D85A30">
    <span class="project-num">/03</span>
    <div class="project-body">
      <h3 class="project-name">MATHLAB</h3>
      <p class="project-desc">Herramienta para estudiantes que necesitan visualizar y analizar funciones matemáticas. Educación técnica que se siente bien de usar.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · NoSQL</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">EN DESARROLLO</span></span>
      </div>
    </div>
  </article>

  <!-- /04 HOMETRACK -->
  <article class="project" style="--project-accent: #7B1B1C">
    <span class="project-num">/04</span>
    <div class="project-body">
      <h3 class="project-name">HOMETRACK</h3>
      <p class="project-desc">App de análisis y gestión de gastos del hogar. Dashboard claro, sin ruido. Datos que ayudan a tomar decisiones reales.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · SQL</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">EN DESARROLLO</span></span>
      </div>
    </div>
  </article>

  <!-- /05 COLONIST -->
  <article class="project" style="--project-accent: #5B4A8A">
    <span class="project-num">/05</span>
    <div class="project-body">
      <h3 class="project-name">COLONIST</h3>
      <p class="project-desc">Reimplementación de juego de estrategia tipo Catan. Exploración técnica pura — donde reglas simples generan complejidad emergente.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · Game Logic</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">EXPERIMENTO</span></span>
      </div>
    </div>
  </article>

  <!-- /06 TIENDA VIRTUAL -->
  <article class="project" style="--project-accent: #888780">
    <span class="project-num">/06</span>
    <div class="project-body">
      <h3 class="project-name">TIENDA VIRTUAL</h3>
      <p class="project-desc">Plataforma e-commerce completa. Catálogo, carrito, gestión de pedidos. SaaS aplicado al comercio real.</p>
      <div class="project-meta">
        <span><span class="meta-label">STACK </span><span class="meta-value">Python · Reflex · SQL</span></span>
        <span><span class="meta-label">STATUS </span><span class="meta-value project-status">EN DESARROLLO</span></span>
      </div>
    </div>
  </article>

</section>
```

---

### 4.6 · Work Layer — animaciones GSAP

```javascript
// Encabezado Work
gsap.to('.work-label', {
  opacity: 1, duration: 0.6, ease: 'power2.out',
  scrollTrigger: { trigger: '#work', start: 'top 80%' }
});
gsap.to('.work-title', {
  opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
  scrollTrigger: { trigger: '#work', start: 'top 80%' }, delay: 0.1
});

// Proyectos — entran uno a uno
document.querySelectorAll('.project').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      toggleActions: 'play none none none',
    },
    delay: i * 0.06,
  });
});
```

---

### ✅ CRITERIOS DE VALIDACIÓN — BLOQUE 4

- [ ] El texto del System Layer es legible sobre los rayos en todo momento
- [ ] La quote aparece con el borde rojo izquierdo visible y elegante
- [ ] Los 6 proyectos tienen cada uno su color de acento en el borde izquierdo
- [ ] ALMACEN destaca visualmente sobre los demás con el badge FLAGSHIP
- [ ] El hover de cada proyecto cambia sutil el borde — no agresivo
- [ ] Los proyectos entran de forma escalonada al hacer scroll — no todos a la vez
- [ ] El canvas está en modo INTENSE en la sección Work — más rayos, más energía
- [ ] La jerarquía visual es clara: ALMACEN > resto

---
---

## BLOQUE 5 — LAB + SIGNALS + POLISH + MOBILE
### `estado: BLOQUEADO — espera Bloque 4` · Prioridad: MEDIA

> **Objetivo:** Completar las capas finales y pulir toda la experiencia hasta que se sienta perfecta.

---

### 5.1 · Lab Layer — HTML + CSS

Archivo: `css/sections/lab.css`

```css
#lab {
  height: 100vh;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 52px;
  position: relative;
  z-index: 5;
}

.lab-label {
  font-family: var(--font-technical);
  font-size: 10px;
  color: var(--teal);
  letter-spacing: 0.18em;
  margin-bottom: 16px;
  opacity: 0;
}

.lab-title {
  font-family: var(--font-editorial);
  font-size: clamp(28px, 3.5vw, 44px);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
  opacity: 0;
  transform: translateY(20px);
}

.lab-subtitle {
  font-family: var(--font-editorial);
  font-size: 18px;
  color: var(--muted);
  margin-bottom: 60px;
  opacity: 0;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1px;
  background: rgba(29,158,117,0.08);
  border: 1px solid rgba(29,158,117,0.08);
  opacity: 0;
  transform: translateY(20px);
}

.lab-item {
  padding: 28px 24px;
  background: rgba(5,8,22,0.6);
  backdrop-filter: blur(2px);
  transition: background 0.3s ease;
}

.lab-item:hover {
  background: rgba(15,46,47,0.7);
}

.lab-item-tag {
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  letter-spacing: 0.12em;
  margin-bottom: 10px;
  opacity: 0.6;
}

.lab-item-name {
  font-family: var(--font-editorial);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.lab-item-desc {
  font-family: var(--font-editorial);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
```

```html
<section id="lab">
  <p class="lab-label">LABORATORY ─────────────────────────────</p>
  <h2 class="lab-title">El sistema piensa en voz alta.</h2>
  <p class="lab-subtitle">Experimentos, demos, ideas sin terminar que igual impresionan.</p>

  <div class="lab-grid">
    <div class="lab-item">
      <p class="lab-item-tag">ALGORITMO · VISUAL</p>
      <h3 class="lab-item-name">Lightning BG</h3>
      <p class="lab-item-desc">Motor de rayos estocásticos. El fondo de este portfolio.</p>
    </div>
    <div class="lab-item">
      <p class="lab-item-tag">DATA · ANALYSIS</p>
      <h3 class="lab-item-name">Dataset Explorer</h3>
      <p class="lab-item-desc">Explorador visual de datasets. Próximamente.</p>
    </div>
    <div class="lab-item">
      <p class="lab-item-tag">GAME · LOGIC</p>
      <h3 class="lab-item-name">Rule Engine</h3>
      <p class="lab-item-desc">Motor de reglas para sistemas complejos. En progreso.</p>
    </div>
  </div>
</section>
```

**Animaciones Lab:**
```javascript
gsap.to('.lab-label',    { opacity: 1, duration: 0.6, scrollTrigger: { trigger: '#lab', start: 'top 80%' } });
gsap.to('.lab-title',    { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '#lab', start: 'top 80%' }, delay: 0.1 });
gsap.to('.lab-subtitle', { opacity: 1, duration: 0.7, scrollTrigger: { trigger: '#lab', start: 'top 80%' }, delay: 0.2 });
gsap.to('.lab-grid',     { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '.lab-grid', start: 'top 88%' }, delay: 0.1 });
```

---

### 5.2 · Signals Layer — HTML + CSS

Archivo: `css/sections/signals.css`

```css
#signals {
  height: 100vh;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0 52px;
  position: relative;
  z-index: 5;
}

.signals-label {
  font-family: var(--font-technical);
  font-size: 10px;
  color: var(--teal);
  letter-spacing: 0.18em;
  margin-bottom: 40px;
  opacity: 0;
}

.signals-title {
  font-family: var(--font-editorial);
  font-size: clamp(28px, 3.5vw, 48px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 16px;
  text-shadow: 0 0 40px rgba(5,8,22,0.9);
  opacity: 0;
  transform: translateY(20px);
}

.signals-sub {
  font-family: var(--font-editorial);
  font-size: 18px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 60px;
  max-width: 480px;
  opacity: 0;
}

.signals-links {
  display: flex;
  gap: 40px;
  opacity: 0;
  transform: translateY(16px);
}

.signal-link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.signal-link:hover { opacity: 0.7; }

.signal-link-label {
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  letter-spacing: 0.14em;
}

.signal-link-value {
  font-family: var(--font-technical);
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.06em;
}

.signals-footer {
  position: absolute;
  bottom: 32px;
  left: 52px;
  right: 52px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
}

.signals-footer-left {
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--muted);
  opacity: 0.4;
  letter-spacing: 0.1em;
}

.signals-footer-right {
  font-family: var(--font-technical);
  font-size: 9px;
  color: var(--teal);
  opacity: 0.4;
  letter-spacing: 0.1em;
}
```

```html
<section id="signals">
  <p class="signals-label">SIGNALS ─────────────────────────────────</p>

  <h2 class="signals-title">
    El sistema está disponible.
  </h2>

  <p class="signals-sub">
    Si tienes un problema que vale la pena resolver<br>
    — hablemos.
  </p>

  <div class="signals-links">
    <a class="signal-link" href="mailto:tu@email.com">
      <span class="signal-link-label">EMAIL</span>
      <span class="signal-link-value">tu@email.com</span>
    </a>
    <a class="signal-link" href="https://github.com/leonukeg" target="_blank">
      <span class="signal-link-label">GITHUB</span>
      <span class="signal-link-value">@leonukeg</span>
    </a>
    <a class="signal-link" href="https://linkedin.com/in/leonukeg" target="_blank">
      <span class="signal-link-label">LINKEDIN</span>
      <span class="signal-link-value">Freddy León</span>
    </a>
  </div>

  <div class="signals-footer">
    <span class="signals-footer-left">© 2025 LEONUKEG · Freddy León</span>
    <span class="signals-footer-right">BUILD WITH INTENTION</span>
  </div>
</section>
```

**Animaciones Signals:**
```javascript
gsap.to('.signals-label', { opacity: 1, duration: 0.6, scrollTrigger: { trigger: '#signals', start: 'top 80%' } });
gsap.to('.signals-title', { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: '#signals', start: 'top 80%' }, delay: 0.15 });
gsap.to('.signals-sub',   { opacity: 1, duration: 0.8, scrollTrigger: { trigger: '#signals', start: 'top 80%' }, delay: 0.3 });
gsap.to('.signals-links', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.signals-links', start: 'top 88%' } });
gsap.to('.signals-footer',{ opacity: 1, duration: 1.0, scrollTrigger: { trigger: '.signals-footer', start: 'top 95%' } });
```

---

### 5.3 · Polish general

**Grain texture:**
```css
/* layout.css */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 100;
  mix-blend-mode: overlay;
}
```

**HUD — coordenadas en tiempo real:**
```javascript
// hud.js
window.addEventListener('mousemove', (e) => {
  const nx = ((e.clientX / window.innerWidth)  * 2 - 1).toFixed(3);
  const ny = ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3);
  document.getElementById('hud-br').textContent = `X: ${nx} · Y: ${ny}`;
});
```

**Smooth scroll entre secciones (solo con teclado):**
```javascript
// Permitir navegación por teclado entre secciones
const sectionIds = ['entry', 'system', 'work', 'lab', 'signals'];
let currentIdx = 0;

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && currentIdx < sectionIds.length - 1) {
    currentIdx++;
    document.getElementById(sectionIds[currentIdx]).scrollIntoView({ behavior: 'smooth' });
  }
  if (e.key === 'ArrowUp' && currentIdx > 0) {
    currentIdx--;
    document.getElementById(sectionIds[currentIdx]).scrollIntoView({ behavior: 'smooth' });
  }
});
```

---

### 5.4 · Mobile — adaptaciones

Breakpoint: `@media (max-width: 768px)`

```css
/* En todas las secciones */
@media (max-width: 768px) {

  /* Entry */
  #entry { padding: 0 28px; }
  .hero-name { font-size: 52px; }
  .hero-tagline { font-size: 24px; }

  /* System */
  #system { padding: 60px 28px; height: auto; min-height: 100vh; }

  /* Work */
  #work { padding: 60px 28px; height: auto; }
  .project { grid-template-columns: 48px 1fr; gap: 0 16px; }
  .project-name { font-size: 20px; }

  /* Lab */
  #lab { padding: 60px 28px; height: auto; min-height: 100vh; }
  .lab-grid { grid-template-columns: 1fr; }

  /* Signals */
  #signals { padding: 60px 28px; height: auto; min-height: 100vh; }
  .signals-links { flex-direction: column; gap: 24px; }
  .signals-footer { position: relative; bottom: auto; left: auto; right: auto; margin-top: 48px; flex-direction: column; gap: 8px; }

  /* HUD simplificado */
  #hud-tl { display: none; }
  #hud-bl { display: none; }
  #scroll-index { display: none; }
}
```

**Canvas en mobile — parámetros reducidos:**
```javascript
// lightning.worker.js — detectar si es mobile
const isMobile = W < 768;
const MODES_MOBILE = {
  CALM:   { spawnRate: 0.40, countMin: 3, countMax: 5  },
  ACTIVE: { spawnRate: 0.55, countMin: 4, countMax: 7  },
  INTENSE:{ spawnRate: 0.70, countMin: 5, countMax: 9  },
  STORM:  { spawnRate: 0.80, countMin: 7, countMax: 11 },
};
// usar MODES_MOBILE si isMobile, MODES si desktop
```

**Touch events:**
```javascript
// lightning.js
canvas.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  const r = canvas.getBoundingClientRect();
  const nx = ((t.clientX / window.innerWidth)  * 2 - 1).toFixed(3);
  const ny = ((t.clientY / window.innerHeight) * 2 - 1).toFixed(3);
  document.getElementById('hud-br').textContent = `X: ${nx} · Y: ${ny}`;
}, { passive: true });
```

---

### 5.5 · Performance final

- [ ] Lighthouse Performance score **> 85**
- [ ] First Contentful Paint **< 2s**
- [ ] Canvas estable en **55fps mínimo** desktop
- [ ] Sin memory leaks en el Worker (DevTools → Memory → Heap snapshot)
- [ ] Verificar en Chrome, Firefox, Safari
- [ ] Verificar en iPhone (Safari iOS) y Android (Chrome)
- [ ] `preconnect` a Google Fonts en `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```

---

### ✅ CRITERIOS DE VALIDACIÓN — BLOQUE 5 (FINAL)

- [ ] Lab Layer comunica energía de laboratorio — no página de "otros proyectos"
- [ ] Signals Layer es mínimo, poético y funcional — 0 formularios
- [ ] El grain texture es imperceptible conscientemente pero se siente en la textura
- [ ] Las coordenadas del HUD se actualizan en tiempo real con el mouse
- [ ] En mobile el portfolio es usable y mantiene la atmósfera
- [ ] El footer de Signals se siente como el sistema diciéndose adiós
- [ ] La experiencia completa de scroll se siente como **descender en un sistema vivo**
- [ ] Un visitante nuevo, sin contexto, dice: *"¿qué es esto?"* con curiosidad positiva
- [ ] La reacción ideal: como bajarse de una montaña rusa

---
---

## RESUMEN

| Bloque | Contenido | Archivos clave | Estado |
|---|---|---|---|
| **1** | Motor de rayos — Canvas + Web Worker | `lightning.js` · `lightning.worker.js` | `PENDIENTE` |
| **2** | Entry Layer — primera pantalla | `index.html` · `entry.css` · `main.js` | `BLOQUEADO` |
| **3** | Scroll + transiciones de modo | `main.js` (IntersectionObserver) | `BLOQUEADO` |
| **4** | System Layer + Work Layer | `system.css` · `work.css` · `main.js` | `BLOQUEADO` |
| **5** | Lab + Signals + Polish + Mobile | `lab.css` · `signals.css` · responsive | `BLOQUEADO` |

---

## CHECKLIST GLOBAL — ANTES DE ENTREGAR

- [ ] Los rayos nunca se detienen — siempre hay actividad en el canvas
- [ ] El texto es legible sobre los rayos en todas las secciones
- [ ] El scroll es completamente nativo — 0 hijacking
- [ ] Las animaciones de entrada usan GSAP ScrollTrigger correctamente
- [ ] El HUD muestra coordenadas reales del cursor
- [ ] El índice lateral (01–05) se actualiza con el scroll
- [ ] Los 6 proyectos tienen cada uno su color de acento
- [ ] La grain texture está activa y es imperceptible conscientemente
- [ ] Mobile funciona y mantiene la atmósfera
- [ ] Lighthouse Performance > 85
- [ ] Probado en Chrome, Firefox, Safari

---

## REGLAS DE TRABAJO

1. **Un bloque a la vez** — no avanzar sin validar todos los criterios
2. **Los rayos son el alma** — si no se sienten vivos, nada más importa
3. **Nunca `#000000`, nunca `#ffffff`** — siempre `#050816` y `#E8E4D8`
4. **Sin scroll hijacking** — nunca, bajo ningún concepto
5. **Sin frameworks JS** excepto GSAP para animaciones
6. **Si algo parece un template de Webflow, está mal** — rehacer
7. **Performance primero** — 55fps es no negociable en desktop

---

## ARCHIVOS DE REFERENCIA

| Archivo | Contenido |
|---|---|
| `LEONUKEG_whitepaper_v2.md` | Identidad completa, filosofía, contenido, paleta |
| `LEONUKEG_prompt_lightning_v2.md` | Detalle técnico completo del motor de rayos |
| `LEONUKEG_plan_trabajo_v2.md` | Este documento — hoja de ruta paso a paso |

---

## FASE SIGUIENTE (POST HTML/CSS/JS)

Cuando el portfolio esté validado y se sienta exactamente como se quiere, se porta a **Reflex (Python)**:

- El motor de rayos (`lightning.js` + `lightning.worker.js`) se integra como componente custom JS en Reflex
- El HTML de cada sección se convierte en componentes Python con `rx.el.*`
- El CSS se migra a estilos inline de Reflex o archivo CSS externo
- GSAP se inyecta via `rx.script` en el componente correspondiente
- El routing lo maneja Reflex nativamente

La migración es directa porque toda la lógica visual ya está en JS vanilla — Reflex solo envuelve la estructura.

---

`LEONUKEG · PLAN DE TRABAJO v2.0 · HTML/CSS/JS → REFLEX · BUILD WITH INTENTION`
