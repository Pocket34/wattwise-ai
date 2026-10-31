// WattWise AI — Web Audio API sound system
// Generates short tones programmatically — no external files needed

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let userHasInteracted = false;

// Track user interaction to respect browser autoplay policies
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    userHasInteracted = true;
    window.removeEventListener('click', markInteracted);
    window.removeEventListener('keydown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
  };
  window.addEventListener('click', markInteracted);
  window.addEventListener('keydown', markInteracted);
  window.addEventListener('touchstart', markInteracted);
}

function getCtx(): AudioContext | null {
  if (!userHasInteracted) return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

type SoundType = 'tick' | 'click' | 'activate' | 'success' | 'warning' | 'toggle';

// Sound definitions: [waveform, frequency, duration_ms, gain]
const SOUNDS: Record<SoundType, { type: OscillatorType; freq: number; dur: number; gain: number; freqEnd?: number }> = {
  tick:     { type: 'sine',     freq: 800,  dur: 50,  gain: 0.08 },
  click:    { type: 'triangle', freq: 600,  dur: 60,  gain: 0.10 },
  activate: { type: 'sine',     freq: 520,  dur: 150, gain: 0.12, freqEnd: 780 },
  success:  { type: 'sine',     freq: 660,  dur: 200, gain: 0.12, freqEnd: 880 },
  warning:  { type: 'triangle', freq: 440,  dur: 180, gain: 0.10, freqEnd: 340 },
  toggle:   { type: 'sine',     freq: 480,  dur: 100, gain: 0.09, freqEnd: 640 },
};

export function playSound(type: SoundType) {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const s = SOUNDS[type];
  const now = ctx.currentTime;
  const durSec = s.dur / 1000;

  // Oscillator
  const osc = ctx.createOscillator();
  osc.type = s.type;
  osc.frequency.setValueAtTime(s.freq, now);
  if (s.freqEnd) {
    osc.frequency.linearRampToValueAtTime(s.freqEnd, now + durSec);
  }

  // Gain envelope: quick attack, smooth release
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(s.gain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durSec);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durSec + 0.01);
}
