/**
 * Lightweight Web Audio API UI sound synthesizer (zero external audio files, 0ms latency).
 */

let audioCtx = null;
const STORAGE_KEY = 'formstudio_sound_enabled';

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, String(Boolean(enabled)));
  } catch {
    // ignore storage errors
  }
}

function playTone({
  freq,
  endFreq = null,
  duration = 0.1,
  type = 'sine',
  volume = 0.1,
  delay = 0,
}) {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // ignore audio errors
  }
}

export const sounds = {
  /** Soft bubbly pop when tapping a choice / checkbox / scale pill */
  pop() {
    playTone({ freq: 520, endFreq: 740, duration: 0.075, type: 'sine', volume: 0.1 });
  },

  /** Gentle curious double-tone when picking "No" (opens comment box) */
  curious() {
    playTone({ freq: 440, duration: 0.08, type: 'triangle', volume: 0.08, delay: 0 });
    playTone({ freq: 370, duration: 0.11, type: 'triangle', volume: 0.07, delay: 0.07 });
  },

  /** Crisp subtle navigation tick for Next / Back */
  step(forward = true) {
    playTone({
      freq: forward ? 460 : 420,
      endFreq: forward ? 580 : 340,
      duration: 0.055,
      type: 'sine',
      volume: 0.065,
    });
  },

  /** Cheerful 2-note chime when starting the form */
  start() {
    playTone({ freq: 523.25, duration: 0.12, type: 'sine', volume: 0.1, delay: 0 });
    playTone({ freq: 783.99, duration: 0.18, type: 'sine', volume: 0.11, delay: 0.09 });
  },

  /** Bright 3-note checkpoint chime when entering a new section */
  milestone() {
    playTone({ freq: 587.33, duration: 0.1, type: 'sine', volume: 0.085, delay: 0 });
    playTone({ freq: 783.99, duration: 0.11, type: 'sine', volume: 0.09, delay: 0.08 });
    playTone({ freq: 1046.5, duration: 0.18, type: 'sine', volume: 0.095, delay: 0.16 });
  },

  /** Soft low nudge on validation error */
  error() {
    playTone({ freq: 230, endFreq: 175, duration: 0.12, type: 'triangle', volume: 0.1, delay: 0 });
    playTone({ freq: 195, endFreq: 150, duration: 0.13, type: 'triangle', volume: 0.08, delay: 0.1 });
  },

  /** Celebratory arpeggio on form submission */
  complete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      playTone({
        freq,
        duration: i === notes.length - 1 ? 0.34 : 0.13,
        type: 'sine',
        volume: 0.11,
        delay: i * 0.085,
      });
    });
  },
};
