/**
 * lightning.worker.js
 * LEONUKEG Portfolio — Procedural Simulation Engine (Web Worker)
 * 
 * Responsibilidad: Generar segmentos de rayo de forma estocástica (Lichtenberg)
 * en un hilo separado para mantener la UI fluida (60fps).
 */

'use strict';

// ── STATE VARIABLES ───────────────────────────────────────────────────────
let segments = [];
let W = 800;
let H = 600;

let currentMode = 'CALM';
let nextMode = 'CALM';
let interpolationFactor = 0;

let liveSpawnRate = 0.40;
let liveCountMin  = 2;
let liveCountMax  = 5;

let mouseX = 0, mouseY = 0;
let isOverContent = false;
let mouseActive = false;
let mouseTimer = null;

// Constant tokens
const LERP_SPEED = 0.03;
const isMobile   = () => W < 768;

// ── SIMULATION MODES ──────────────────────────────────────────────────────
const MODES = {
  CALM:   { spawnRate: 0.35, countMin: 3, countMax: 6 },
  ACTIVE: { spawnRate: 0.45, countMin: 4, countMax: 8 },
  INTENSE:{ spawnRate: 0.55, countMin: 6, countMax: 12 },
  STORM:  { spawnRate: 0.65, countMin: 8, countMax: 16 },
};

const MODES_MOBILE = {
  CALM:   { spawnRate: 0.25, countMin: 2, countMax: 4 },
  ACTIVE: { spawnRate: 0.35, countMin: 3, countMax: 6 },
  INTENSE:{ spawnRate: 0.45, countMin: 4, countMax: 8 },
  STORM:  { spawnRate: 0.55, countMin: 5, countMax: 10 },
};

const getModeParams = (m) => (isMobile() ? MODES_MOBILE[m] : MODES[m]);

// Bolt context
let activeBoltFamily = 0; // 0=Teal, 1=Warm (Red/Copper)

/**
 * Assigns color index based on bolt depth and current family.
 * @param {number} depth Recursion depth
 * @returns {number} Color index for lightning.js palette
 */
function assignColorIndex(depth) {
  if (depth <= 2) {
    if (activeBoltFamily === 1) return Math.random() < 0.6 ? 3 : 4; 
    return Math.random() < 0.6 ? 0 : 1; 
  }
  if (depth <= 5) {
    const r = Math.random();
    if (r < 0.40) return [0, 1][Math.floor(Math.random() * 2)];
    if (r < 0.75) return 3; 
    return 4;              
  }
  return Math.random() < 0.5 ? 2 : 3;
}

/**
 * Recursive Lichtenberg figure generator.
 * Creates jagged, organic electrical discharges.
 */
function buildBolt(ox, oy, angle, length, width, life, branchProb, depth) {
  if (depth > 5 || length < 5) return [];

  const result = [];
  const steps   = Math.floor(rnd(6, 12)); 
  const stepLen = length / steps;

  let x = ox, y = oy;
  let driftAngle = angle;
  const driftBias = rnd(-0.12, 0.12);

  for (let i = 0; i < steps; i++) {
    const chaos    = 0.75 + (depth * 0.15);
    const deviate  = rnd(-chaos, chaos);
    
    driftAngle    += driftBias;
    const curAngle = driftAngle + deviate;

    const currentStepLen = stepLen * rnd(0.6, 1.4);
    const nx = x + Math.cos(curAngle) * currentStepLen;
    const ny = y + Math.sin(curAngle) * currentStepLen;

    const currentWidth = width * (1 - (i / steps) * 0.4);

    result.push({
      x1: x, y1: y, x2: nx, y2: ny,
      width: currentWidth,
      life: life + Math.floor(rnd(-2, 2)),
      maxLife: life,
      depth,
      colorIdx: assignColorIndex(depth),
    });

    // Branching logic
    if (Math.random() < branchProb) {
      const sign   = Math.random() < 0.5 ? 1 : -1;
      const bAngle = curAngle + rnd(0.4, 0.9) * sign;
      const bLen   = length * rnd(0.4, 0.7) * (1 - depth * 0.1);
      const bWidth = currentWidth * 0.65;
      const bLife  = Math.max(4, Math.ceil(life * 0.8));

      result.push(...buildBolt(x, y, bAngle, bLen, bWidth, bLife, branchProb * 0.65, depth + 1));
    }

    x = nx; y = ny;
  }
  return result;
}

/**
 * Standard spawn cycle for ambient lightning.
 */
function spawnCycle() {
  const margin = 80;
  const originCount = Math.random() < 0.3 ? 2 : 1;
  const botsPerOrigin = Math.floor(rnd(liveCountMin, liveCountMax));

  for (let o = 0; o < originCount; o++) {
    const ox = rnd(margin, W - margin);
    const oy = rnd(margin, H - margin);

    for (let i = 0; i < botsPerOrigin; i++) {
      activeBoltFamily = Math.random() < 0.40 ? 1 : 0;
      const angle      = Math.random() * Math.PI * 2;
      const length     = rnd(W * 0.4, W * 0.7);
      const width      = rnd(0.5, 1.3);
      const life       = Math.floor(rnd(10, 20));
      const branchProb = rnd(0.12, 0.25);

      segments.push(...buildBolt(ox, oy, angle, length, width, life, branchProb, 0));
    }
  }
}

/**
 * Handles smooth transition between simulation modes.
 */
function interpolateModeParameters() {
  if (currentMode === nextMode) return getModeParams(currentMode);

  interpolationFactor += 0.02; 
  if (interpolationFactor >= 1) {
    currentMode = nextMode;
    interpolationFactor = 0;
    return getModeParams(currentMode);
  }

  const p1 = getModeParams(currentMode);
  const p2 = getModeParams(nextMode);

  return {
    spawnRate: p1.spawnRate + (p2.spawnRate - p1.spawnRate) * interpolationFactor,
    countMin:  Math.round(p1.countMin + (p2.countMin - p1.countMin) * interpolationFactor),
    countMax:  Math.round(p1.countMax + (p2.countMax - p1.countMax) * interpolationFactor),
  };
}

/**
 * Main simulation tick.
 */
function step() {
  const params = interpolateModeParameters();
  liveSpawnRate = params.spawnRate;
  liveCountMin  = params.countMin;
  liveCountMax  = params.countMax;

  // Life management
  for (let i = 0; i < segments.length; i++) { segments[i].life--; }
  segments = segments.filter(s => s.life > 0);

  // INTERACTIVE SPARKS: Generated from cursor position
  if (mouseActive && !isOverContent && Math.random() < 0.35) {
    const angle  = Math.random() * Math.PI * 2;
    const length = rnd(40, 100); 
    const width  = rnd(1.2, 2.2); 
    const life   = Math.floor(rnd(6, 12));
    const branch = rnd(0.15, 0.30);
    
    activeBoltFamily = Math.random() < 0.3 ? 3 : 0; 
    segments.push(...buildBolt(mouseX, mouseY, angle, length, width, life, branch, 0));
  }

  // AMBIENT BOLTS: Stochastic spawn
  if (Math.random() < liveSpawnRate && segments.length < 300) {
    spawnCycle();
  }

  postMessage({ segments });
}

// 40ms interval for stable physics simulation (approx 25 physics-fps)
setInterval(step, 40);

// Messaging interface
self.onmessage = ({ data }) => {
  switch (data.type) {
    case 'init':
    case 'resize':
      W = data.W; H = data.H;
      break;
    case 'setMode':
      if (data.mode !== nextMode) {
        nextMode = data.mode;
        interpolationFactor = 0;
      }
      break;
    case 'mouseMove':
      mouseX = data.x; mouseY = data.y;
      isOverContent = data.isOverContent;
      mouseActive = true;
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => { mouseActive = false; }, 200);
      break;
    case 'contentStatus':
      isOverContent = data.isOverContent;
      break;
  }
};

// Utils
function rnd(a, b) { return a + Math.random() * (b - a); }
