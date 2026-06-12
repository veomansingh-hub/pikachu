import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- HTML Elements ---
const cursor = document.getElementById('customCursor');
const cursorDot = document.getElementById('customCursorDot');
const scrollContainer = document.getElementById('scrollContainer');
const faqItems = document.querySelectorAll('.faq-item');
const navLinks = document.querySelectorAll('.nav-link');
const lightningOverlay = document.getElementById('lightningOverlay');

// --- Custom Cursor Logic ---
if (window.innerWidth > 1024) {
  document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.4, ease: 'power2.out' });
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.1 });
  });

  const interactiveElements = document.querySelectorAll('a, button, .service-card, .why-card, .price-card, .faq-trigger');
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('hovering-element');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('hovering-element');
    });
  });
}

// --- Audio Synthesis Engine & Pikachu Voice ---
let audioCtx = null;
const pikachuAudio = new Audio('https://play.pokemonshowdown.com/audio/cries/pikachu.mp3');
pikachuAudio.volume = 0.6;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Electric Zap Synthesis
function playZapSound() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = Math.random() > 0.4 ? 'sawtooth' : 'triangle';
  osc.frequency.setValueAtTime(900 + Math.random() * 500, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150 + Math.random() * 100, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.13);
}

// Thunder & Heavy Lightning Synthesis
function playThunderSound() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const now = audioCtx.currentTime;

  // Sharp Crack
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(1400, now);
  osc1.frequency.linearRampToValueAtTime(250, now + 0.2);
  gain1.gain.setValueAtTime(0.2, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start();
  osc1.stop(now + 0.3);

  // Rumble
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(95, now);
  osc2.frequency.linearRampToValueAtTime(25, now + 1.4);
  gain2.gain.setValueAtTime(0.35, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start();
  osc2.stop(now + 1.6);

  // White Noise Crackle
  const bufferSize = audioCtx.sampleRate * 1.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(350, now);
  filter.frequency.exponentialRampToValueAtTime(50, now + 1.1);
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.22, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noiseNode.start(now);
  noiseNode.stop(now + 1.5);
}

// --- Dynamic Particle Pikachu & Starfield Canvas ---
const canvas = document.getElementById('fluid-canvas');
const ctx = canvas.getContext('2d');
let gardenElements = [];
let pikachuParticles = [];
let electricSparks = [];
const maxGardenElements = 100; 
let mouse = { x: null, y: null, speed: 0, lastX: null, lastY: null };
let lastMouseMoveTime = Date.now();

// State Machine Variables
const STATE_BALL = 'ball';
const STATE_OPENING = 'opening';
const STATE_RUNNING = 'running';
const STATE_SHOCK = 'shock';
const STATE_PIKACHU = 'pikachu';
let currentState = STATE_BALL;

let openingProgress = 0;
let runProgress = 0;
let runPathPoints = [];
let runPathIndex = 0;
let runTargetX = 0;
let runTargetY = 0;
let shockTimer = 0;
let pikachuStateStartTime = 0;

// Steering Physics Variables for Pikachu Center Anchor
let globalPikachuX = window.innerWidth * 0.25;
let globalPikachuY = window.innerHeight * 0.5;
let globalPikachuAngle = 0;
let globalPikachuScaleX = 1;
let pikachuTargetScaleX = 1;

let pikachuVelX = 0;
let pikachuVelY = 0;
let wanderAngle = Math.random() * Math.PI * 2;
let targetX = window.innerWidth * 0.25;
let targetY = window.innerHeight * 0.5;

// Pikachu SVG Paths classified by type and color
const pikachuPaths = {
  yellow: [
    // Chubby Pikachu Body
    "M 85 70 Q 100 88, 115 70 Q 116 88, 100 95 Q 84 88, 85 70 Z",
    // Round Head
    "M 80 52 Q 100 34, 120 52 Q 118 68, 100 70 Q 82 68, 80 52 Z",
    // Left Ear main
    "M 86 42 L 55 12 L 95 36 Z",
    // Right Ear main
    "M 114 42 L 145 12 L 105 36 Z",
    // Lightning Tail
    "M 92 84 L 75 92 L 80 80 L 60 88 L 65 74 L 38 82 L 44 64 L 30 70 L 36 50",
    // Tiny Chubby Arms
    "M 85 72 Q 74 78, 85 82 M 115 72 Q 126 78, 115 82"
  ],
  black: [
    // Left Ear black tip
    "M 55 12 L 67 19 Q 63 15, 55 12 Z",
    // Right Ear black tip
    "M 145 12 L 133 19 Q 137 15, 145 12 Z",
    // Eyes
    "M 90 48 Q 91.5 48, 91.5 49.5 Q 91.5 51, 90 51 Q 88.5 51, 88.5 49.5 Z",
    "M 110 48 Q 111.5 48, 111.5 49.5 Q 111.5 51, 110 51 Q 108.5 51, 108.5 49.5 Z",
    // Cute Nose
    "M 100 53 L 98 52 L 102 52 Z",
    // Happy Mouth
    "M 96 58 Q 100 62, 104 58"
  ],
  red: [
    // Red Cheeks (Spark emitters!)
    "M 87 58 Q 81 58, 81 63 Q 87 65, 93 63 Q 93 58, 87 58 Z",
    "M 113 58 Q 107 58, 107 63 Q 113 65, 119 63 Q 119 58, 113 58 Z"
  ]
};

function samplePikachuPoints() {
  const points = [];
  const svgNS = "http://www.w3.org/2000/svg";
  const dummySvg = document.createElementNS(svgNS, "svg");
  dummySvg.setAttribute("style", "position:absolute;visibility:hidden;width:0;height:0;");
  document.body.appendChild(dummySvg);

  const sampleGroup = (pathsArray, type) => {
    pathsArray.forEach((pathStr) => {
      const pathEl = document.createElementNS(svgNS, "path");
      pathEl.setAttribute("d", pathStr);
      dummySvg.appendChild(pathEl);
      
      const length = pathEl.getTotalLength();
      const step = 2.5; // High detailed sampler
      for (let d = 0; d < length; d += step) {
        const p = pathEl.getPointAtLength(d);
        points.push({ x: p.x, y: p.y, type });
      }
    });
  };

  sampleGroup(pikachuPaths.yellow, "yellow");
  sampleGroup(pikachuPaths.black, "black");
  sampleGroup(pikachuPaths.red, "red");

  document.body.removeChild(dummySvg);
  return points;
}

class PikachuParticle {
  constructor(homeX, homeY, type, index, total) {
    this.homeX = homeX;
    this.homeY = homeY;
    this.type = type;
    
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 2 + 1.2;

    // Pikachu Original Colors
    if (this.type === "yellow") {
      this.pikaColor = { r: 253, g: 224, b: 71, a: 0.92 };
    } else if (this.type === "black") {
      this.pikaColor = { r: 24, g: 24, b: 27, a: 0.92 };
      this.size = 1.6;
    } else {
      this.pikaColor = { r: 239, g: 68, b: 68, a: 0.92 };
    }

    // Color interpolation placeholders
    this.currentR = 253;
    this.currentG = 224;
    this.currentB = 71;
    this.currentA = 0.92;

    this.calculatePokeballTarget(index, total);
  }

  // Pre-calculate beautiful Poké Ball morph mappings
  calculatePokeballTarget(index, total) {
    const R = 23; 
    const cx = 100;
    const cy = 55;
    
    if (index < total * 0.22) {
      // Outer border (black)
      this.ballGroup = 'outer';
      const theta = (index / (total * 0.22)) * Math.PI * 2;
      this.ballX = cx + R * Math.cos(theta);
      this.ballY = cy + R * Math.sin(theta);
      this.ballColor = { r: 24, g: 24, b: 27, a: 0.92 };
    } else if (index < total * 0.38) {
      // Horizontal belt (black)
      this.ballGroup = 'belt';
      const t = (index - total * 0.22) / (total * 0.16);
      this.ballX = cx - R + 2 * R * t;
      this.ballY = cy + (Math.random() - 0.5) * 1.5; 
      this.ballColor = { r: 24, g: 24, b: 27, a: 0.92 };
    } else if (index < total * 0.46) {
      // Center button outer ring (black)
      this.ballGroup = 'button-outer';
      const theta = ((index - total * 0.38) / (total * 0.08)) * Math.PI * 2;
      const Rbutton = 6.2;
      this.ballX = cx + Rbutton * Math.cos(theta);
      this.ballY = cy + Rbutton * Math.sin(theta);
      this.ballColor = { r: 24, g: 24, b: 27, a: 0.92 };
    } else if (index < total * 0.54) {
      // Center button inner (white)
      this.ballGroup = 'button-inner';
      const theta = ((index - total * 0.46) / (total * 0.08)) * Math.PI * 2;
      const Rinner = 3.2;
      this.ballX = cx + Rinner * Math.cos(theta);
      this.ballY = cy + Rinner * Math.sin(theta);
      this.ballColor = { r: 240, g: 240, b: 245, a: 0.95 };
    } else if (index < total * 0.77) {
      // Top hemisphere (red)
      this.ballGroup = 'top-dome';
      const u = (index - total * 0.54) / (total * 0.23);
      const r = Math.sqrt(u) * (R - 2.0);
      const theta = u * 19.3 * Math.PI;
      const finalTheta = (theta % Math.PI) + Math.PI; // Top Half
      this.ballX = cx + r * Math.cos(finalTheta);
      this.ballY = cy + r * Math.sin(finalTheta);
      this.ballColor = { r: 239, g: 68, b: 68, a: 0.92 };
    } else {
      // Bottom hemisphere (white)
      this.ballGroup = 'bottom-dome';
      const u = (index - total * 0.77) / (total * 0.23);
      const r = Math.sqrt(u) * (R - 2.0);
      const theta = u * 19.3 * Math.PI;
      const finalTheta = theta % Math.PI; // Bottom Half
      this.ballX = cx + r * Math.cos(finalTheta);
      this.ballY = cy + r * Math.sin(finalTheta);
      this.ballColor = { r: 240, g: 240, b: 245, a: 0.92 };
    }
  }

  update() {
    let tx, ty;
    
    // Choose coordinate home based on states
    if (currentState === STATE_BALL) {
      const dxRelative = (this.ballX - 100) * 2.2 * globalPikachuScaleX;
      const dyRelative = (this.ballY - 55) * 2.2;
      const rad = globalPikachuAngle * Math.PI / 180;
      tx = globalPikachuX + (dxRelative * Math.cos(rad) - dyRelative * Math.sin(rad));
      ty = globalPikachuY + (dxRelative * Math.sin(rad) + dyRelative * Math.cos(rad));
    } else if (currentState === STATE_OPENING) {
      let py = this.ballY;
      let px = this.ballX;
      if (this.ballGroup === 'top-dome') {
        py -= openingProgress * 70;
      } else if (this.ballGroup === 'bottom-dome') {
        py += openingProgress * 70;
      } else {
        const angle = Math.atan2(this.ballY - 55, this.ballX - 100);
        px += Math.cos(angle) * openingProgress * 150;
        py += Math.sin(angle) * openingProgress * 150;
      }
      const dxRelative = (px - 100) * 2.2 * globalPikachuScaleX;
      const dyRelative = (py - 55) * 2.2;
      const rad = globalPikachuAngle * Math.PI / 180;
      tx = globalPikachuX + (dxRelative * Math.cos(rad) - dyRelative * Math.sin(rad));
      ty = globalPikachuY + (dxRelative * Math.sin(rad) + dyRelative * Math.cos(rad));
    } else {
      const dxRelative = (this.homeX - 100) * 2.2 * globalPikachuScaleX;
      const dyRelative = (this.homeY - 55) * 2.2;
      const rad = globalPikachuAngle * Math.PI / 180;
      tx = globalPikachuX + (dxRelative * Math.cos(rad) - dyRelative * Math.sin(rad));
      ty = globalPikachuY + (dxRelative * Math.sin(rad) + dyRelative * Math.cos(rad));
    }

    const springForceX = (tx - this.x) * 0.058;
    const springForceY = (ty - this.y) * 0.058;

    this.vx += springForceX;
    this.vy += springForceY;
    this.vx *= 0.81;
    this.vy *= 0.81;

    // Cursor Repulsion in interactive modes
    if (mouse.x !== null && currentState !== STATE_OPENING && currentState !== STATE_RUNNING) {
      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const dist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (dist < 100) {
        const force = (100 - dist) / 100;
        const multiplier = currentState === STATE_SHOCK ? 22 : (mouse.speed + 8);
        this.vx += (mdx / dist) * force * multiplier;
        this.vy += (mdy / dist) * force * multiplier;
        
        if (this.type === "red" && Math.random() > 0.82) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkSpeed = Math.random() * 4 + 4;
          electricSparks.push(new ElectricSpark(this.x, this.y, Math.cos(sparkAngle) * sparkSpeed, Math.sin(sparkAngle) * sparkSpeed));
          if (Math.random() > 0.6) playZapSound();
        }
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Color morph interpolate
    let targetCol = (currentState === STATE_BALL || currentState === STATE_OPENING) ? this.ballColor : this.pikaColor;
    this.currentR += (targetCol.r - this.currentR) * 0.09;
    this.currentG += (targetCol.g - this.currentG) * 0.09;
    this.currentB += (targetCol.b - this.currentB) * 0.09;
    this.currentA += (targetCol.a - this.currentA) * 0.09;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(this.currentR)}, ${Math.round(this.currentG)}, ${Math.round(this.currentB)}, ${this.currentA})`;
    
    if (currentState === STATE_BALL || currentState === STATE_OPENING) {
      if (this.ballGroup === 'top-dome') {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      } else {
        ctx.shadowBlur = 0;
      }
    } else {
      if (this.type === "red") {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
      } else if (this.type === "yellow") {
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(253, 224, 71, 0.4)';
      } else {
        ctx.shadowBlur = 0;
      }
    }
    
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// Lightning Spark particle
class ElectricSpark {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.history = [{ x: this.x, y: this.y }];
    this.alpha = 1.0;
  }
  update() {
    this.x += this.vx + (Math.random() - 0.5) * 6;
    this.y += this.vy + (Math.random() - 0.5) * 6;
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > 5) this.history.shift();
    this.alpha -= 0.04; 
  }
  draw() {
    if (this.history.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.strokeStyle = `rgba(253, 224, 71, ${this.alpha})`; 
    ctx.lineWidth = Math.random() * 2.5 + 1;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

// Drifting leaves/pollen/petals background
class GardenElement {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * -200; 
    this.size = Math.random() * 8 + 4; // slightly larger for detail
    this.alpha = Math.random() * 0.45 + 0.2; // clear visibility
    
    // Slow motion drift
    this.speedY = Math.random() * 0.25 + 0.15; // Slow vertical fall
    this.swaySpeed = Math.random() * 0.01 + 0.005;
    this.swayOffset = Math.random() * 100;
    this.speedX = Math.sin(this.swayOffset) * 0.1;
    
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.006; // Slow rotation
  }

  update() {
    this.swayOffset += this.swaySpeed;
    this.speedX = Math.sin(this.swayOffset) * 0.15;
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotSpeed;

    if (this.y > canvas.height + 50 || this.x > canvas.width + 50 || this.x < -50) {
      this.reset();
      this.y = -50;
      this.x = Math.random() * canvas.width;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Glossy linear gradient for 3D leaf depth
    const grad = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
    grad.addColorStop(0, `rgba(244, 63, 94, ${this.alpha})`); // vibrant rose
    grad.addColorStop(0.35, `rgba(251, 113, 133, ${this.alpha * 1.15})`); // glossy reflection highlight
    grad.addColorStop(0.85, `rgba(190, 24, 74, ${this.alpha})`); // deep rich crimson shadows
    
    ctx.beginPath();
    // Beautiful curved organic teardrop rose petal
    ctx.moveTo(0, -this.size * 1.6);
    ctx.quadraticCurveTo(this.size * 1.3, -this.size * 0.8, this.size * 0.8, this.size * 0.5);
    ctx.quadraticCurveTo(0, this.size * 1.5, -this.size * 0.8, this.size * 0.5);
    ctx.quadraticCurveTo(-this.size * 1.3, -this.size * 0.8, 0, -this.size * 1.6);
    
    ctx.fillStyle = grad;
    
    // Glossy petal back shadow glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Add specular highlight line on upper edge to make it shiny/reflective
    ctx.beginPath();
    ctx.arc(-this.size * 0.3, -this.size * 0.5, this.size * 0.5, Math.PI, Math.PI * 1.5);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 1.2})`;
    ctx.lineWidth = this.size * 0.12;
    ctx.stroke();

    ctx.restore();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Sample points and load systems
const sampledPoints = samplePikachuPoints();
pikachuParticles = sampledPoints.map((p, idx) => new PikachuParticle(p.x, p.y, p.type, idx, sampledPoints.length));

for (let i = 0; i < maxGardenElements; i++) {
  gardenElements.push(new GardenElement());
}

window.addEventListener('mousemove', (e) => {
  lastMouseMoveTime = Date.now();
  if (mouse.lastX !== null) {
    const dx = e.clientX - mouse.lastX;
    const dy = e.clientY - mouse.lastY;
    mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.15, 6);
  }
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.lastX = e.clientX;
  mouse.lastY = e.clientY;
});

window.addEventListener('mouseleave', () => {
  mouse.x = null;
  mouse.y = null;
  mouse.speed = 0;
});

// Click to Trigger Pokeball / Recall Morph
window.addEventListener('click', (e) => {
  initAudio(); // Activate Web Audio Context

  const clickDist = Math.sqrt(Math.pow(e.clientX - globalPikachuX, 2) + Math.pow(e.clientY - globalPikachuY, 2));

  if (currentState === STATE_BALL) {
    if (clickDist < 75) {
      // release Pikachu
      currentState = STATE_OPENING;
      openingProgress = 0;
      
      // Play cry audio right away
      pikachuAudio.currentTime = 0;
      pikachuAudio.play().catch(() => {});
    }
  } else if (currentState === STATE_PIKACHU) {
    if (clickDist < 80) {
      // Morph back to ball
      currentState = STATE_BALL;
    }
  }
});

// Canvas render loop
function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw blurred green garden canopy tree blobs (background layer)
  const canopyCoords = [
    { cx: 0, cy: 0, r: 480, col: 'rgba(220, 252, 231, 0.35)' },
    { cx: canvas.width * 0.9, cy: canvas.height * 0.1, r: 350, col: 'rgba(220, 252, 231, 0.28)' },
    { cx: canvas.width * 0.2, cy: canvas.height * 0.8, r: 520, col: 'rgba(220, 252, 231, 0.32)' }
  ];

  canopyCoords.forEach((blob) => {
    const grad = ctx.createRadialGradient(blob.cx, blob.cy, blob.r * 0.2, blob.cx, blob.cy, blob.r);
    grad.addColorStop(0, blob.col);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(blob.cx, blob.cy, blob.r, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // 2. Draw drifting leaves/pollen/petals
  for (let i = 0; i < gardenElements.length; i++) {
    gardenElements[i].update();
    gardenElements[i].draw();
  }

  // 3. State-Machine Routing
  if (currentState === STATE_BALL) {
    // Poké Ball Gently Floats
    wanderAngle += (Math.random() - 0.5) * 0.08;
    globalPikachuX += Math.cos(wanderAngle) * 0.7;
    globalPikachuY += Math.sin(wanderAngle) * 0.7;
    
    // Bounds check
    const pad = 80;
    if (globalPikachuX < pad) globalPikachuX = pad;
    if (globalPikachuX > canvas.width - pad) globalPikachuX = canvas.width - pad;
    if (globalPikachuY < pad) globalPikachuY = pad;
    if (globalPikachuY > canvas.height - pad) globalPikachuY = canvas.height - pad;

    globalPikachuAngle = Math.sin(Date.now() * 0.003) * 6; // gentle rocking
    globalPikachuScaleX = 1;

  } else if (currentState === STATE_OPENING) {
    openingProgress += 0.024;
    
    // Slight shake during split opening
    globalPikachuX += (Math.random() - 0.5) * 2;
    globalPikachuY += (Math.random() - 0.5) * 2;

    if (openingProgress >= 1) {
      // Transition to Running
      currentState = STATE_RUNNING;
      runProgress = 0;
      
      // Calculate running path: a dynamic zig-zag around the screen
      runPathPoints = [
        { x: globalPikachuX, y: globalPikachuY },
        { x: canvas.width * 0.2, y: canvas.height * 0.75 },
        { x: canvas.width * 0.8, y: canvas.height * 0.3 },
        { x: canvas.width * 0.5, y: canvas.height * 0.55 } // Finish at center
      ];
      runPathIndex = 0;
      runTargetX = runPathPoints[1].x;
      runTargetY = runPathPoints[1].y;
    }

  } else if (currentState === STATE_RUNNING) {
    runProgress += 0.038;
    
    // Linear interpolate along path segments
    const startPt = runPathPoints[runPathIndex];
    const endPt = runPathPoints[runPathIndex + 1];
    
    globalPikachuX = startPt.x + (endPt.x - startPt.x) * runProgress;
    globalPikachuY = startPt.y + (endPt.y - startPt.y) * runProgress;

    // Direct trails
    if (Math.random() > 0.3) {
      const trailAngle = Math.random() * Math.PI * 2;
      electricSparks.push(new ElectricSpark(globalPikachuX, globalPikachuY, Math.cos(trailAngle) * 2, Math.sin(trailAngle) * 2));
      playZapSound();
    }

    // Facing direction
    pikachuTargetScaleX = (endPt.x > startPt.x) ? 1 : -1;
    globalPikachuScaleX = pikachuTargetScaleX;
    globalPikachuAngle = (endPt.y - startPt.y) * 0.06;

    if (runProgress >= 1) {
      runProgress = 0;
      runPathIndex++;
      if (runPathIndex < runPathPoints.length - 1) {
        runTargetX = runPathPoints[runPathIndex + 1].x;
        runTargetY = runPathPoints[runPathIndex + 1].y;
      } else {
        // Run completed! Begin big lightning shock
        currentState = STATE_SHOCK;
        shockTimer = 0;
        
        // Fullscreen lightning visual class trigger
        lightningOverlay.classList.add('active');
        document.body.classList.add('shake-active');
        
        playThunderSound();
      }
    }

  } else if (currentState === STATE_SHOCK) {
    shockTimer += 1;
    
    // Violent vibration displacement
    globalPikachuX += (Math.random() - 0.5) * 12;
    globalPikachuY += (Math.random() - 0.5) * 12;

    // Spew massive lightning spark sparks in all directions
    for (let s = 0; s < 4; s++) {
      const sa = Math.random() * Math.PI * 2;
      const ss = Math.random() * 12 + 6;
      electricSparks.push(new ElectricSpark(
        globalPikachuX + (Math.random() - 0.5) * 30,
        globalPikachuY + (Math.random() - 0.5) * 30,
        Math.cos(sa) * ss,
        Math.sin(sa) * ss
      ));
    }
    
    if (Math.random() > 0.4) {
      playZapSound();
    }

    if (shockTimer > 95) {
      // Done shocking, clear effects
      currentState = STATE_PIKACHU;
      pikachuStateStartTime = Date.now();
      lightningOverlay.classList.remove('active');
      document.body.classList.remove('shake-active');
    }

  } else if (currentState === STATE_PIKACHU) {
    // Auto-recall back to Pokeball after 15 seconds of idle wandering
    if (Date.now() - pikachuStateStartTime > 15000) {
      currentState = STATE_BALL;
    }

    // Normal Wandering logic (decoupled from cursor follow)
    wanderAngle += (Math.random() - 0.5) * 0.12;
    const slowSpeed = 0.9;
    targetX += Math.cos(wanderAngle) * slowSpeed;
    targetY += Math.sin(wanderAngle) * slowSpeed;

    const boundPadding = 40; 
    if (targetX < boundPadding) {
      wanderAngle = 0; 
      targetX = boundPadding;
    } else if (targetX > window.innerWidth - boundPadding) {
      wanderAngle = Math.PI; 
      targetX = window.innerWidth - boundPadding;
    }
    if (targetY < boundPadding) {
      wanderAngle = Math.PI / 2; 
      targetY = boundPadding;
    } else if (targetY > window.innerHeight - boundPadding) {
      wanderAngle = -Math.PI / 2; 
      targetY = window.innerHeight - boundPadding;
    }

    const steeringX = (targetX - globalPikachuX) * 0.02;
    const steeringY = (targetY - globalPikachuY) * 0.02;

    pikachuVelX += steeringX;
    pikachuVelY += steeringY;

    const maxVel = 1.4;
    const curVel = Math.sqrt(pikachuVelX * pikachuVelX + pikachuVelY * pikachuVelY);
    if (curVel > maxVel) {
      pikachuVelX = (pikachuVelX / curVel) * maxVel;
      pikachuVelY = (pikachuVelY / curVel) * maxVel;
    }

    pikachuVelX *= 0.96;
    pikachuVelY *= 0.96;

    globalPikachuX += pikachuVelX;
    globalPikachuY += pikachuVelY;

    globalPikachuAngle = (pikachuVelX * 4);

    if (Math.abs(pikachuVelX) > 0.08) {
      pikachuTargetScaleX = pikachuVelX > 0 ? 1 : -1;
    }
    globalPikachuScaleX += (pikachuTargetScaleX - globalPikachuScaleX) * 0.1;
  }

  // Update cursor hover states if cursor is active
  if (mouse.x !== null && cursor) {
    const dx = mouse.x - globalPikachuX;
    const dy = mouse.y - globalPikachuY;
    const hoverDist = Math.sqrt(dx * dx + dy * dy);
    
    if (currentState === STATE_BALL && hoverDist < 65) {
      cursor.classList.add('cursor-clickable');
    } else if (currentState === STATE_PIKACHU && hoverDist < 75) {
      cursor.classList.add('cursor-clickable');
    } else {
      cursor.classList.remove('cursor-clickable');
    }
  }

  // 4. Update and Draw Electric Sparks
  for (let i = electricSparks.length - 1; i >= 0; i--) {
    electricSparks[i].update();
    electricSparks[i].draw();
    if (electricSparks[i].alpha <= 0) {
      electricSparks.splice(i, 1);
    }
  }

  // 5. Update and draw Pikachu particles
  for (let i = 0; i < pikachuParticles.length; i++) {
    pikachuParticles[i].update();
    pikachuParticles[i].draw();
  }

  // 6. Constellation linking (Pikachu dots connect)
  if (currentState !== STATE_OPENING) {
    ctx.strokeStyle = (currentState === STATE_BALL) ? 'rgba(239, 68, 68, 0.09)' : 'rgba(253, 224, 71, 0.16)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < pikachuParticles.length; i++) {
      for (let j = i + 1; j < pikachuParticles.length; j++) {
        const dx = pikachuParticles[i].x - pikachuParticles[j].x;
        const dy = pikachuParticles[i].y - pikachuParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 19) {
          ctx.beginPath();
          ctx.moveTo(pikachuParticles[i].x, pikachuParticles[i].y);
          ctx.lineTo(pikachuParticles[j].x, pikachuParticles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  requestAnimationFrame(animateCanvas);
}
animateCanvas();

// --- GSAP Horizontal Scrollytelling ---
if (window.innerWidth > 1024) {
  const panels = gsap.utils.toArray('.panel');
  
  gsap.to(panels, {
    x: () => -(scrollContainer.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: scrollContainer,
      pin: true,
      scrub: 1.1,
      start: 'top top',
      end: () => `+=${scrollContainer.scrollWidth - window.innerWidth}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        const totalPanels = panels.length;
        const currentActiveIndex = Math.min(Math.floor(progress * totalPanels), totalPanels - 1);
        navLinks.forEach((link, idx) => {
          if (idx === currentActiveIndex) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    }
  });
}

// --- FAQ Accordion Logic ---
faqItems.forEach((item) => {
  const trigger = item.querySelector('.faq-trigger');
  const content = item.querySelector('.faq-content');

  trigger.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    
    faqItems.forEach((el) => {
      el.classList.remove('active');
      el.querySelector('.faq-content').style.maxHeight = null;
    });

    if (!isActive) {
      item.classList.add('active');
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
});
