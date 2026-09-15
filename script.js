const stage = document.getElementById('videoStage');
const video = document.getElementById('danceVideo');
const foldLeft = document.getElementById('foldLeft');
const foldRight = document.getElementById('foldRight');

const CLAP_TIME = 8.3;
let opened = false;

video.play().catch(() => {});

document.addEventListener(
  'pointerdown',
  () => {
    if (video.muted) video.muted = false;
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
}

video.addEventListener('timeupdate', () => {
  if (!opened && video.currentTime >= CLAP_TIME) openReveal();
});

video.addEventListener('ended', openReveal);

setTimeout(openReveal, 9500);
