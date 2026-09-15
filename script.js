const stage = document.getElementById('videoStage');
const video = document.getElementById('danceVideo');
const theme = document.getElementById('themeSong');
const soundHint = document.getElementById('soundHint');
const foldLeft = document.getElementById('foldLeft');
const foldRight = document.getElementById('foldRight');
const fireworksCanvas = document.getElementById('fireworks');
const fx = fireworksCanvas.getContext('2d');

const CLAP_TIME = 8.3;
const pageLoadTime = performance.now();
let opened = false;

const FIREWORK_COLORS = ['#ff2fa8', '#ff8ad4', '#ffd166', '#ffffff', '#c77dff', '#ff6fc4'];
const ROCKET_GRAVITY = 0.05;
let fireworksActive = false;
let particles = [];
let lastLaunch = 0;

function resizeFireworksCanvas() {
  const hero = document.querySelector('.hero');
  const rect = hero.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  fireworksCanvas.width = rect.width * dpr;
  fireworksCanvas.height = rect.height * dpr;
  fx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', () => {
  if (fireworksActive) resizeFireworksCanvas();
});

function launchFirework(width, height) {
  const startX = width * (0.15 + Math.random() * 0.7);
  const targetY = height * (0.12 + Math.random() * 0.35);
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

  // Solve for the launch speed needed to just reach targetY under
  // ROCKET_GRAVITY, so the burst height scales with the real screen
  // height instead of stalling early on tall (mobile) viewports.
  const distance = height - targetY;
  const requiredSpeed = Math.sqrt(2 * ROCKET_GRAVITY * distance);

  particles.push({
    type: 'rocket',
    x: startX,
    y: height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -requiredSpeed * (0.97 + Math.random() * 0.08),
    targetY,
    color,
    trail: [],
  });
}

function explode(x, y, color) {
  const count = 32 + Math.floor(Math.random() * 22);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = Math.random() * 3.4 + 1.4;
    particles.push({
      type: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.014,
      color,
    });
  }
}

function stepFireworks(timestamp) {
  if (!fireworksActive) return;

  const dpr = window.devicePixelRatio || 1;
  const width = fireworksCanvas.width / dpr;
  const height = fireworksCanvas.height / dpr;
  fx.clearRect(0, 0, width, height);

  if (timestamp - lastLaunch > 650 + Math.random() * 900) {
    launchFirework(width, height);
    lastLaunch = timestamp;
  }

  particles = particles.filter((p) => {
    if (p.type === 'rocket') {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += ROCKET_GRAVITY;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();

      fx.beginPath();
      fx.strokeStyle = p.color;
      fx.lineWidth = 2;
      p.trail.forEach((pt, i) => {
        if (i === 0) fx.moveTo(pt.x, pt.y);
        else fx.lineTo(pt.x, pt.y);
      });
      fx.stroke();

      if (p.y <= p.targetY || p.vy >= 0) {
        explode(p.x, p.y, p.color);
        return false;
      }
      return true;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vx *= 0.98;
    p.life -= p.decay;

    fx.globalAlpha = Math.max(p.life, 0);
    fx.fillStyle = p.color;
    fx.beginPath();
    fx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    fx.fill();
    fx.globalAlpha = 1;

    return p.life > 0;
  });

  requestAnimationFrame(stepFireworks);
}

function startFireworks() {
  if (fireworksActive) return;
  fireworksActive = true;
  resizeFireworksCanvas();
  fireworksCanvas.classList.add('active');
  requestAnimationFrame(stepFireworks);
}

video.play().catch(() => {});
theme.play().catch(() => {});

document.addEventListener(
  'pointerdown',
  () => {
    const elapsed = (performance.now() - pageLoadTime) / 1000;
    if (theme.duration && isFinite(theme.duration)) {
      theme.currentTime = elapsed % theme.duration;
    } else {
      theme.currentTime = elapsed;
    }
    theme.muted = false;
    theme.play().catch(() => {});
    soundHint.classList.add('hidden');
  },
  { once: true }
);

function openReveal() {
  if (opened) return;
  opened = true;

  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.max(rect.width / vw, rect.height / vh);
  const sw = rect.width / scale;
  const sh = rect.height / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const snapshot = `url(${canvas.toDataURL('image/jpeg', 0.92)})`;

  foldLeft.style.backgroundImage = snapshot;
  foldRight.style.backgroundImage = snapshot;

  video.style.visibility = 'hidden';
  video.pause();
  stage.classList.add('opened');
  startFireworks();
}

video.addEventListener('timeupdate', () => {
  if (!opened && video.currentTime >= CLAP_TIME) openReveal();
});

video.addEventListener('ended', openReveal);

setTimeout(openReveal, 9500);
