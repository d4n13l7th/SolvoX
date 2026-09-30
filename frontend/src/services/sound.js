const STORAGE_KEY = 'solvox.sound.enabled';

function enabled() {
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

let ctx = null;
const audioCache = new Map();

const SOUND_FILES = Object.freeze({
  playerAttack: '/assets/audio/player-attack.mp3',
  chapter1BossAttack: '/assets/audio/chapter1-boss-attack.mp3',
});

function playAudioFile(kind, volume = 0.72) {
  if (!enabled()) return;
  const src = SOUND_FILES[kind];
  if (!src) return;

  let audio = audioCache.get(kind);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    audioCache.set(kind, audio);
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    const result = audio.play();
    if (result?.catch) result.catch(() => {});
  } catch {
    // Browsers can reject/restrict audio playback; the synthesized fallback
    // below still keeps the existing sound system functional.
  }
}

function getContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  return ctx;
}

function tone({ frequency = 440, duration = 0.1, volume = 0.045, type = 'sine', glideTo = null, delay = 0 } = {}) {
  if (!enabled()) return;
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function setSoundEnabled(value) {
  localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
}

export function isSoundEnabled() {
  return enabled();
}

export function playSound(kind = 'click') {
  if (!enabled()) return;
  switch (kind) {
    case 'playerAttack':
      playAudioFile('playerAttack', 0.72);
      break;
    case 'chapter1BossAttack':
      playAudioFile('chapter1BossAttack', 0.78);
      break;
    case 'correct':
      tone({ frequency: 523.25, glideTo: 659.25, duration: 0.14, type: 'triangle', volume: 0.055 });
      tone({ frequency: 659.25, glideTo: 783.99, duration: 0.12, type: 'triangle', volume: 0.045, delay: 0.08 });
      break;
    case 'wrong':
      tone({ frequency: 220, glideTo: 150, duration: 0.18, type: 'sawtooth', volume: 0.035 });
      break;
    case 'attack':
      tone({ frequency: 150, glideTo: 78, duration: 0.11, type: 'square', volume: 0.035 });
      tone({ frequency: 420, glideTo: 230, duration: 0.08, type: 'triangle', volume: 0.028, delay: 0.04 });
      break;
    case 'hint':
      tone({ frequency: 392, glideTo: 523.25, duration: 0.18, type: 'sine', volume: 0.035 });
      break;
    case 'victory':
      tone({ frequency: 523.25, duration: 0.13, type: 'triangle', volume: 0.05 });
      tone({ frequency: 659.25, duration: 0.13, type: 'triangle', volume: 0.045, delay: 0.10 });
      tone({ frequency: 783.99, duration: 0.18, type: 'triangle', volume: 0.05, delay: 0.20 });
      break;
    case 'defeat':
      tone({ frequency: 329.63, glideTo: 246.94, duration: 0.18, type: 'sine', volume: 0.04 });
      tone({ frequency: 220, glideTo: 164.81, duration: 0.22, type: 'sine', volume: 0.035, delay: 0.12 });
      break;
    case 'menu':
    default:
      tone({ frequency: 440, duration: 0.06, type: 'sine', volume: 0.025 });
      break;
  }
}
