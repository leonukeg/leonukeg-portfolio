/**
 * lightning.js
 * LEONUKEG Portfolio — Rendering Engine (Main Thread)
 * Responsible for canvas setup, trail rendering, and coordination with the Web Worker.
 */

'use strict';

// ── CONFIGURATION & TOKENS ────────────────────────────────────────────────
const COLORS = [
  '#1D9E75',  // 0 — Vibrant Teal
  '#7B1B1C',  // 1 — Blood Red
  '#D85A30',  // 2 — Copper
  '#E8E4D8',  // 3 — Warm White
  '#5DCAA5',  // 4 — Light Teal
];

// Glow string prefixes for dynamic alpha injection
const GLOW_TEAL   = 'rgba(29, 158, 117, ';
const GLOW_RED    = 'rgba(180, 40, 40, ';
const GLOW_COPPER = 'rgba(216, 100, 48, ';

const canvas = document.getElementById('lightning');
const ctx    = canvas.getContext('2d');

// Initial styling
canvas.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 0;
  pointer-events: none;
  opacity: 0.6;
`;

/**
 * Handle canvas resizing and DPR scaling for crisp visuals.
 */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  worker.postMessage({ type: 'resize', W: window.innerWidth, H: window.innerHeight });
}

let lastSegments = [];
let mouseX = 0, mouseY = 0;
let isOverContent = false;

/**
 * Main render loop.
 * Implements a persistence-trail effect by not clearing the canvas fully.
 */
function render() {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Background fade (persistence trail)
  ctx.fillStyle = 'rgba(5, 8, 22, 0.75)'; 
  ctx.fillRect(0, 0, W, H);

  // Draw segments received from the worker
  for (const s of lastSegments) {
    const alpha = s.life / s.maxLife;
    const ci    = s.colorIdx;

    const glowStr = ci === 1 ? GLOW_RED
                  : ci === 2 ? GLOW_COPPER
                  : GLOW_TEAL;

    // Background Glow (Outer Resplendence)
    if (s.depth < 3) {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = glowStr + (alpha * 0.2) + ')';
      ctx.lineWidth   = s.width * 5.0;
      ctx.stroke();
    }

    // Core Bolt (Structural Discharge)
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.strokeStyle = COLORS[ci] || COLORS[0];
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth   = s.width * 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(render);
}

// ── WORKER INITIALIZATION ────────────────────────────────────────────────
const worker = new Worker('./js/lightning.worker.js');

worker.onmessage = ({ data }) => {
  lastSegments = data.segments;
};

/**
 * Exposed global method for changing simulation parameters dynamically.
 */
window.lightningSetMode = (mode) => {
  worker.postMessage({ type: 'setMode', mode });
};

/**
 * Setup mouse tracking and content collision detection.
 */
function setupInteractivity() {
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    worker.postMessage({
      type: 'mouseMove',
      x: e.clientX,
      y: e.clientY,
      isOverContent
    });
  });

  // Selective exclusion: Lightning interaction is disabled over content layers
  const selectors = ['.project', '.lab-item', '.system-content', '.signals-links', '.hero-name', '.hero-tagline'];
  
  function updateStatus(status) {
    isOverContent = status;
    worker.postMessage({ type: 'contentStatus', isOverContent });
  }

  document.querySelectorAll(selectors.join(',')).forEach(el => {
    el.addEventListener('mouseenter', () => updateStatus(true));
    el.addEventListener('mouseleave', () => updateStatus(false));
  });
}

// ── BOOTSTRAP ─────────────────────────────────────────────────────────────
resizeCanvas();
worker.postMessage({ type: 'init', W: window.innerWidth, H: window.innerHeight });
setupInteractivity();
requestAnimationFrame(render);
new ResizeObserver(resizeCanvas).observe(document.body);
