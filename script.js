/* =============================================
   CINEMATIC BIRTHDAY WEBSITE — MAIN SCRIPT
   All animations, particles, music, and interactions
   ============================================= */

// =============================================
// 1. PRELOADER
// =============================================
const preloader = document.getElementById('preloader');

window.addEventListener('load', () => {
  setTimeout(() => {
    preloader.classList.add('hidden');
    // Start music after preloader
    if (musicEnabled) initMusic();
  }, 1000);
});

// =============================================
// 2. MUSIC SYSTEM — Web Audio API Generative Piano
// =============================================
let audioCtx = null;
let musicEnabled = true;
let isPlaying = false;
let musicNodes = [];
let musicInterval = null;

const PIANO_NOTES = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
  'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

const MELODY = [
  'C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'D4',
  'F4', 'A4', 'C5', 'A4', 'G4', 'E4', 'C4', 'D4',
  'E4', 'G4', 'B4', 'C5', 'A4', 'F4', 'E4', 'D4',
  'C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'C4'
];

let melodyIndex = 0;
let melodyTimeout = null;

function initMusic() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    playMelody();
    document.getElementById('musicToggle').classList.add('playing');
    isPlaying = true;
  } catch (e) {
    console.log('Audio not available');
  }
}

function playNote(frequency, duration, time) {
  if (!audioCtx) return;

  // Sine wave for warm piano-like tone
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, time);
  filter.frequency.exponentialRampToValueAtTime(800, time + duration);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
  gain.gain.setValueAtTime(0.12, time + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + duration);

  // Add harmonic for richness
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, time);
  gain2.gain.setValueAtTime(0, time);
  gain2.gain.linearRampToValueAtTime(0.04, time + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(time);
  osc2.stop(time + duration);

  musicNodes.push({ osc, gain, filter, osc2, gain2 });
}

function playChord(notes, duration, time) {
  notes.forEach(note => {
    if (PIANO_NOTES[note]) {
      playNote(PIANO_NOTES[note], duration, time);
    }
  });
}

function playMelody() {
  if (!musicEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const bpm = 65;
  const beatDuration = 60 / bpm;

  // Play current melody note
  const currentNote = MELODY[melodyIndex % MELODY.length];
  if (PIANO_NOTES[currentNote]) {
    playNote(PIANO_NOTES[currentNote], beatDuration * 0.9, now + 0.05);
  }

  // Add harmony every 4 beats
  if (melodyIndex % 4 === 0) {
    const chordNotes = [MELODY[melodyIndex % MELODY.length]];
    const chordIndex = melodyIndex % 16;
    if (chordIndex < 4) chordNotes.push('G4', 'C5');
    else if (chordIndex < 8) chordNotes.push('F4', 'A4');
    else if (chordIndex < 12) chordNotes.push('E4', 'G4');
    else chordNotes.push('D4', 'F4');

    chordNotes.forEach((note, i) => {
      if (PIANO_NOTES[note] && i > 0) {
        playNote(PIANO_NOTES[note], beatDuration * 1.5, now + 0.1);
      }
    });

    // Soft bass
    const bassNotes = ['C3', 'G3', 'A3', 'F3'];
    const bassNote = bassNotes[Math.floor(chordIndex / 4) % bassNotes.length];
    if (PIANO_NOTES[bassNote]) {
      const oscBass = audioCtx.createOscillator();
      const gainBass = audioCtx.createGain();
      oscBass.type = 'sine';
      oscBass.frequency.setValueAtTime(PIANO_NOTES[bassNote], now);
      gainBass.gain.setValueAtTime(0, now);
      gainBass.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 1.8);
      oscBass.connect(gainBass);
      gainBass.connect(audioCtx.destination);
      oscBass.start(now);
      oscBass.stop(now + beatDuration * 2);
      musicNodes.push({ osc: oscBass, gain: gainBass });
    }
  }

  melodyIndex++;
  const nextDelay = (beatDuration * 1000) * 0.75;

  melodyTimeout = setTimeout(playMelody, nextDelay);
}

function toggleMusic() {
  const btn = document.getElementById('musicToggle');

  if (isPlaying) {
    musicEnabled = false;
    clearTimeout(melodyTimeout);
    if (audioCtx) {
      audioCtx.suspend();
    }
    btn.classList.remove('playing');
    isPlaying = false;
  } else {
    musicEnabled = true;
    if (!audioCtx) {
      initMusic();
    } else {
      audioCtx.resume().then(() => {
        playMelody();
        btn.classList.add('playing');
        isPlaying = true;
      });
    }
  }
}

document.getElementById('musicToggle').addEventListener('click', toggleMusic);

// =============================================
// 3. CANVAS PARTICLE SYSTEM
// =============================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId = null;
let currentScene = 'opening';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.5 + 0.5;
    this.twinkleSpeed = Math.random() * 0.02 + 0.005;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.opacity = Math.random() * 0.8 + 0.2;
    this.color = this.getColor();
  }

  getColor() {
    const colors = [
      '255, 255, 255',
      '255, 215, 0',
      '173, 216, 230',
      '255, 182, 193',
      '255, 255, 224'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(time) {
    this.twinklePhase += this.twinkleSpeed;
    this.currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.twinklePhase + time * 0.001));
  }

  draw() {
    const alpha = this.currentOpacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
    ctx.fill();

    // Glow effect for larger stars
    if (this.size > 1.5) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${alpha * 0.1})`;
      ctx.fill();
    }
  }
}

class Petal {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.size = Math.random() * 15 + 10;
    this.speedY = Math.random() * 1.5 + 0.5;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.03 - 0.015;
    this.opacity = Math.random() * 0.6 + 0.3;
    this.hue = Math.random() * 30 + 340; // Pink range
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
    this.rotation += this.rotationSpeed;

    if (this.y > canvas.height + 20) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.5, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 70%, 75%, ${this.opacity})`;
    ctx.fill();
    ctx.restore();
  }
}

class Lantern {
  constructor(index) {
    this.index = index;
    this.reset();
  }

  reset() {
    this.x = canvas.width * (0.1 + Math.random() * 0.8);
    this.y = canvas.height * (0.2 + Math.random() * 0.6);
    this.baseY = this.y;
    this.size = Math.random() * 20 + 20;
    this.floatAmplitude = Math.random() * 30 + 15;
    this.floatSpeed = Math.random() * 0.003 + 0.002;
    this.phase = Math.random() * Math.PI * 2;
    this.opacity = Math.random() * 0.4 + 0.2;
    this.hue = Math.random() * 30 + 25; // Orange range
  }

  update(time) {
    this.y = this.baseY + Math.sin(time * this.floatSpeed + this.phase) * this.floatAmplitude;
    this.x += Math.sin(time * this.floatSpeed * 0.5 + this.phase) * 0.3;
  }

  draw(time) {
    ctx.save();
    const glowSize = this.size * 2;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
    grad.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${this.opacity * 0.3})`);
    grad.addColorStop(0.5, `hsla(${this.hue}, 80%, 50%, ${this.opacity * 0.1})`);
    grad.addColorStop(1, `hsla(${this.hue}, 80%, 50%, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - glowSize, this.y - glowSize, glowSize * 2, glowSize * 2);

    // Lantern body
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size * 0.4, this.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 70%, 50%, ${this.opacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(30, 50%, 60%, ${this.opacity * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Light core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(45, 100%, 80%, ${this.opacity * 0.6})`;
    ctx.fill();
    ctx.restore();
  }
}

// =============================================
// 3b. AURORA EFFECT — Canvas-based for Chapter 4
// =============================================
class Aurora {
  constructor() {
    this.layers = [];
    for (let i = 0; i < 3; i++) {
      this.layers.push({
        points: [],
        hue: 150 + i * 40 + Math.random() * 30,
        speed: 0.0003 + Math.random() * 0.0003,
        offset: Math.random() * Math.PI * 2,
        amplitude: 30 + Math.random() * 50,
        y: canvas.height * (0.2 + i * 0.08 + Math.random() * 0.05)
      });
      for (let j = 0; j < 60; j++) {
        this.layers[i].points.push({
          x: (j / 60) * canvas.width,
          y: 0
        });
      }
    }
  }

  update(time) {
    this.layers.forEach((layer, li) => {
      layer.points.forEach((point, pi) => {
        const t = time * layer.speed + layer.offset + pi * 0.1;
        point.y = Math.sin(t * 2 + pi * 0.3) * layer.amplitude * 0.5
          + Math.sin(t * 1.3 + pi * 0.5) * layer.amplitude * 0.3
          + Math.sin(t * 0.7 + pi * 0.2) * layer.amplitude * 0.2;
      });
    });
  }

  draw(time) {
    this.layers.forEach((layer) => {
      ctx.beginPath();
      ctx.moveTo(layer.points[0].x, layer.y + layer.points[0].y);
      for (let i = 1; i < layer.points.length; i++) {
        ctx.lineTo(layer.points[i].x, layer.y + layer.points[i].y);
      }
      ctx.lineTo(canvas.width, layer.y + 50);
      ctx.lineTo(0, layer.y + 50);
      ctx.closePath();

      const alpha = 0.08 + Math.sin(time * 0.0005 + layer.offset) * 0.04;
      const gradient = ctx.createLinearGradient(0, layer.y - 100, 0, layer.y + 100);
      gradient.addColorStop(0, `hsla(${layer.hue}, 80%, 60%, 0)`);
      gradient.addColorStop(0.3, `hsla(${layer.hue + 20}, 80%, 65%, ${alpha})`);
      gradient.addColorStop(0.6, `hsla(${layer.hue + 40}, 70%, 55%, ${alpha * 0.6})`);
      gradient.addColorStop(1, `hsla(${layer.hue + 60}, 60%, 50%, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }
}

class FireworkParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = Math.random() * 0.01 + 0.005;
    this.size = Math.random() * 3 + 1;
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, life: this.life });
    if (this.trail.length > 8) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.04; // gravity
    this.vx *= 0.99;
    this.vy *= 0.99;
    this.life -= this.decay;
    this.size *= 0.995;
  }

  draw() {
    // Trail
    this.trail.forEach((t, i) => {
      const alpha = (i / this.trail.length) * this.life * 0.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.size * (i / this.trail.length) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
      ctx.fill();
    });

    // Main particle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.life * 0.2})`;
    ctx.fill();
  }
}

let fireworks = [];
let fireworkTimeouts = [];
let lanterns = [];
let petals = [];
let stars = [];
let aurora = null;
let sceneParticles = { stars: true, petals: false, lanterns: false, fireworks: false, aurora: false };

function initParticles() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push(new Star());
  }

  lanterns = [];
  for (let i = 0; i < 8; i++) {
    lanterns.push(new Lantern(i));
  }

  petals = [];
  for (let i = 0; i < 20; i++) {
    petals.push(new Petal());
  }

  aurora = new Aurora();

  sceneParticles = { stars: true, petals: false, lanterns: false, fireworks: false, aurora: false };
}

function createFirework() {
  const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
  const y = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
  const colors = [
    '255, 215, 0', '255, 100, 100', '100, 200, 255',
    '255, 200, 100', '255, 100, 255', '100, 255, 200',
    '255, 150, 50', '200, 200, 255'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const count = Math.floor(Math.random() * 60) + 40;

  for (let i = 0; i < count; i++) {
    fireworks.push(new FireworkParticle(x, y, color));
  }
}

function scheduleFireworks() {
  fireworkTimeouts.forEach(t => clearTimeout(t));
  fireworkTimeouts = [];

  function schedule() {
    createFirework();
    const delay = Math.random() * 1000 + 500;
    fireworkTimeouts.push(setTimeout(schedule, delay));
  }

  schedule();
  // Extra bursts
  setTimeout(createFirework, 200);
  setTimeout(createFirework, 500);
  setTimeout(createFirework, 900);
}

function stopFireworks() {
  fireworkTimeouts.forEach(t => clearTimeout(t));
  fireworkTimeouts = [];
  fireworks = [];
}

function updateCanvas(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Stars (always on except chapter 1 and 5 daylight scenes)
  if (sceneParticles.stars) {
    stars.forEach(star => {
      star.update(time);
      star.draw();
    });
  }

  // Petals
  if (sceneParticles.petals) {
    petals.forEach(petal => {
      petal.update();
      petal.draw();
    });
  }

  // Lanterns
  if (sceneParticles.lanterns) {
    lanterns.forEach(lantern => {
      lantern.update(time);
      lantern.draw(time);
    });
  }

  // Aurora
  if (sceneParticles.aurora && aurora) {
    aurora.update(time);
    aurora.draw(time);
  }

  // Fireworks
  if (sceneParticles.fireworks) {
    fireworks = fireworks.filter(p => p.life > 0);
    fireworks.forEach(p => {
      p.update();
      p.draw();
    });
  }

  animationId = requestAnimationFrame(updateCanvas);
}

function setScene(scene) {
  currentScene = scene;

  switch (scene) {
    case 'opening':
    case 'title':
    case 'closing':
      sceneParticles = { stars: true, petals: false, lanterns: false, fireworks: false, aurora: false };
      stopFireworks();
      break;
    case 'ch1':
      sceneParticles = { stars: false, petals: false, lanterns: false, fireworks: false, aurora: false };
      stopFireworks();
      break;
    case 'ch2':
      sceneParticles = { stars: true, petals: false, lanterns: false, fireworks: false, aurora: false };
      stopFireworks();
      break;
    case 'ch4':
      sceneParticles = { stars: true, petals: false, lanterns: true, fireworks: false, aurora: true };
      stopFireworks();
      break;
    case 'ch5':
      sceneParticles = { stars: true, petals: true, lanterns: false, fireworks: true, aurora: false };
      scheduleFireworks();
      break;
    default:
      sceneParticles = { stars: true, petals: false, lanterns: false, fireworks: false, aurora: false };
      stopFireworks();
      break;
  }
}

initParticles();
updateCanvas(0);

// =============================================
// 4. INTERSECTION OBSERVER — Chapter Visibility
// =============================================
const chapters = document.querySelectorAll('.chapter');

const chapterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      triggerTextAnimations(entry.target);

      // Set scene for particles
      const id = entry.target.id;
      setScene(id);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
});

chapters.forEach(ch => chapterObserver.observe(ch));

// =============================================
// 5. TEXT ANIMATIONS — Staggered Reveal
// =============================================
function triggerTextAnimations(container) {
  // Opening lines
  const openingLines = container.querySelectorAll('.opening-line');
  openingLines.forEach((line, i) => {
    const delay = parseInt(line.dataset.delay) || i * 2000;
    setTimeout(() => {
      line.classList.add('visible');
    }, delay);
  });

  // Chapter 1 lines
  const ch1Lines = container.querySelectorAll('.ch1-line');
  ch1Lines.forEach((line, i) => {
    const delay = parseInt(line.dataset.delay) || i * 2000;
    setTimeout(() => {
      line.classList.add('visible');
    }, delay);
  });

  // Generic lines with stagger
  const lineSelectors = [
    '.ch2-line', '.ch4-line', '.ch6-line', '.ch7-line',
    '.thanks-line', '.hope-line', '.ch7-final-line',
    '.closing-line', '.closing-final-text'
  ];

  lineSelectors.forEach(selector => {
    const lines = container.querySelectorAll(selector);
    lines.forEach((line, i) => {
      setTimeout(() => {
        line.classList.add('visible');
      }, i * 400 + 200);
    });
  });

  // Timeline items
  const timelineItems = container.querySelectorAll('.timeline-item');
  timelineItems.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('visible');
    }, i * 300 + 300);
  });

  // Birthday title
  const birthday = container.querySelector('.ch5-birthday');
  if (birthday) {
    setTimeout(() => {
      birthday.classList.add('visible');
    }, 200);
  }

  // Title content
  const titleContent = container.querySelector('.title-content');
  if (titleContent) {
    setTimeout(() => {
      titleContent.classList.add('visible');
    }, 500);
  }
}

// =============================================
// 6. BOOK NAVIGATION — Chapter 3
// =============================================
let currentPage = 1;
const totalPages = 4;

function updateBook(page) {
  const pages = document.querySelectorAll('.book-page');
  const pageNum = document.getElementById('bookPageNum');
  const prevBtn = document.getElementById('bookPrev');
  const nextBtn = document.getElementById('bookNext');

  pages.forEach((p, i) => {
    const pageIndex = i + 1;
    p.classList.remove('active', 'exit-left');

    if (pageIndex === page) {
      p.classList.add('active');
    } else if (pageIndex < page) {
      p.classList.add('exit-left');
    }
  });

  pageNum.textContent = `${page} / ${totalPages}`;
  prevBtn.disabled = page === 1;
  nextBtn.disabled = page === totalPages;
}

document.getElementById('bookNext').addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    updateBook(currentPage);
  }
});

document.getElementById('bookPrev').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    updateBook(currentPage);
  }
});

// Initialize book
updateBook(1);

// =============================================
// 7. SECRET LETTER MODAL
// =============================================
const letterBtn = document.getElementById('secretLetterBtn');
const modal = document.getElementById('letterModal');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.querySelector('.modal-overlay');

letterBtn.addEventListener('click', () => {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
});

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// =============================================
// 8. PROGRESS BAR
// =============================================
const progressBar = document.getElementById('progressBar');

function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener('scroll', updateProgress);

// =============================================
// 9. STAR FIELD — Title Scene Background
// =============================================
function generateStarField() {
  const container = document.getElementById('starsContainer');
  if (!container) return;

  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'bg-star';
    star.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: white;
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.8 + 0.2};
      animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
    `;
    container.appendChild(star);
  }
}

generateStarField();

// Add twinkle animation keyframes dynamically
const twinkleStyle = document.createElement('style');
twinkleStyle.textContent = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); }
  }
`;
document.head.appendChild(twinkleStyle);

// =============================================
// 10. PARALLAX EFFECT
// =============================================
const parallaxBg = document.getElementById('parallaxBg');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const parallaxValue = scrollY * 0.3;

  // Subtle parallax on background
  parallaxBg.style.transform = `translateY(${parallaxValue * 0.05}px)`;

  // Update chapter backgrounds based on scroll position for some chapters
  const ch1Sky = document.querySelector('.ch1-sky');
  if (ch1Sky) {
    ch1Sky.style.transform = `translateY(${scrollY * 0.02}px)`;
  }

  // Lens flare shift on ch1
  const lensFlare = document.querySelector('.lens-flare');
  if (lensFlare) {
    const moveX = (scrollY * 0.05) % 100;
    lensFlare.style.transform = `translate(${moveX}px, ${-scrollY * 0.03}px) rotate(${scrollY * 0.01}deg)`;
  }
});

// =============================================
// 11. POLAROID GALLERY — Click to Enlarge
// =============================================
const polaroids = document.querySelectorAll('.polaroid');
let polaroidModal = null;

function createPolaroidModal() {
  // Create modal if it doesn't exist
  if (document.getElementById('polaroidModal')) return;

  const modalHTML = `
    <div id="polaroidModal" class="modal polaroid-modal">
      <div class="modal-overlay"></div>
      <div class="polaroid-modal-content">
        <button class="modal-close polaroid-modal-close">&times;</button>
        <div class="polaroid-modal-inner">
          <div class="polaroid-modal-img"></div>
          <p class="polaroid-modal-caption"></p>
          <p class="polaroid-modal-desc"></p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  polaroidModal = document.getElementById('polaroidModal');
  const closeBtn = polaroidModal.querySelector('.polaroid-modal-close');
  const overlay = polaroidModal.querySelector('.modal-overlay');

  closeBtn.addEventListener('click', closePolaroidModal);
  overlay.addEventListener('click', closePolaroidModal);
}

function openPolaroidModal(imgEl, caption) {
  createPolaroidModal();
  const modal = document.getElementById('polaroidModal');
  const modalImg = modal.querySelector('.polaroid-modal-img');
  const modalCaption = modal.querySelector('.polaroid-modal-caption');
  const modalDesc = modal.querySelector('.polaroid-modal-desc');

  // Clone the gradient/emoji from the polaroid
  const bgStyle = imgEl.getAttribute('style') || '';
  const emoji = imgEl.querySelector('span')?.textContent || '📸';

  modalImg.style.cssText = bgStyle + `; width: 300px; height: 280px; display: flex; align-items: center; justify-content: center; font-size: 6rem; border-radius: 5px; margin: 0 auto; box-shadow: 0 5px 20px rgba(0,0,0,0.2);`;
  modalImg.textContent = emoji;
  modalCaption.textContent = caption || 'Kenangan indah';

  const descriptions = {
    'Hari pertama': 'Hari ketika semuanya dimulai. Sebuah awal yang tidak akan pernah terlupakan.',
    'Setiap obrolan': 'Dari basa-basi menjadi percakapan yang dinanti. Setiap kata terasa berarti.',
    'Lagu favorit': 'Lagu yang selalu mengingatkan. Melodi yang menjadi tema cerita kita.',
    'Bagian dari hidup': 'Bukan lagi sekadar kenangan. Kamu adalah bagian dari perjalanan hidup.'
  };
  modalDesc.textContent = descriptions[caption] || 'Sebuah kenangan yang berharga.';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', polaroidEscHandler);
}

function closePolaroidModal() {
  const modal = document.getElementById('polaroidModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.removeEventListener('keydown', polaroidEscHandler);
}

function polaroidEscHandler(e) {
  if (e.key === 'Escape') closePolaroidModal();
}

polaroids.forEach(polaroid => {
  polaroid.addEventListener('click', () => {
    const img = polaroid.querySelector('.polaroid-img');
    const caption = polaroid.querySelector('.polaroid-caption')?.textContent || '';
    openPolaroidModal(img, caption);
  });
});

// =============================================
// 12. SMOOTH SCROLL ANCHOR
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// =============================================
// 13. KEYBOARD NAVIGATION
// =============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    const currentScroll = window.scrollY;
    const viewportHeight = window.innerHeight;
    window.scrollTo({
      top: Math.min(currentScroll + viewportHeight, document.documentElement.scrollHeight - viewportHeight),
      behavior: 'smooth'
    });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const currentScroll = window.scrollY;
    const viewportHeight = window.innerHeight;
    window.scrollTo({
      top: Math.max(currentScroll - viewportHeight, 0),
      behavior: 'smooth'
    });
  }
});

// =============================================
// 14. LENS FLARE — Chapter 1
// =============================================
function createLensFlare() {
  const ch1 = document.getElementById('chapter1');
  if (!ch1) return;

  const flare = document.createElement('div');
  flare.className = 'lens-flare';
  flare.innerHTML = `
    <div class="flare-circle flare-circle-1"></div>
    <div class="flare-circle flare-circle-2"></div>
    <div class="flare-circle flare-circle-3"></div>
    <div class="flare-ray"></div>
  `;
  ch1.appendChild(flare);
}
createLensFlare();

// =============================================
// 15. FIREWORKS DOM ELEMENT (for ch5)
// =============================================
// Add some decorative stars to the closing scene
function generateClosingStars() {
  const closingContainer = document.querySelector('.closing-stars');
  if (!closingContainer) return;

  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'closing-star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: white;
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.8 + 0.2};
      animation: twinkle ${Math.random() * 4 + 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
    closingContainer.appendChild(star);
  }
}

generateClosingStars();

// =============================================
// 16. INITIAL TRIGGER — Show first chapter immediately
// =============================================
// Opening chapter should start visible
document.addEventListener('DOMContentLoaded', () => {
  const opening = document.getElementById('opening');
  if (opening) {
    setTimeout(() => {
      opening.classList.add('visible');
      triggerTextAnimations(opening);
    }, 200);
  }
});

// =============================================
// 17. FALLING PETALS — CSS supplement (ch5)
// =============================================
function generatePetalsCSS() {
  const container = document.getElementById('petalsContainer');
  if (!container) return;

  const colors = ['#FFB7B2', '#FF9A9E', '#FFD1DC', '#FFB5E8', '#FFC3A0'];
  const petalCount = 15;

  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = Math.random() * 12 + 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 6 + 8;
    const delay = Math.random() * 10;
    const left = Math.random() * 100;

    petal.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size * 1.2}px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      border-radius: ${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
    `;
    container.appendChild(petal);
  }
}

generatePetalsCSS();

console.log('🌟 Cinematic Birthday Website — Loaded');
console.log('💌 Made with love, code, and a little bit of magic');
