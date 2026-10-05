// The timer chime: a soft three-strike bell synthesised with the Web Audio
// API (no audio files, works offline). The context is created on the tap
// that starts a timer, so browsers allow it to sound later.

let ctx = null;

/** Call from a user gesture (starting a timer) to unlock audio. */
export function primeAudio() {
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch {
    ctx = null;
  }
}

function strike(at, base, nodes) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(0.32, at + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
  out.connect(ctx.destination);
  nodes.push(out);
  // A bell: the fundamental plus two inharmonic partials that fade faster.
  for (const [ratio, level, decay] of [
    [1, 1, 1.6],
    [2.76, 0.35, 0.7],
    [5.4, 0.12, 0.35],
  ]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * ratio, at);
    g.gain.setValueAtTime(level, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + decay + 0.05);
    nodes.push(osc);
  }
}

function chimeAt(at) {
  const nodes = [];
  [1046.5, 1318.5, 1568].forEach((f, i) => strike(at + i * 0.45, f, nodes));
  return nodes;
}

/** Three gentle strikes, rising (C6, E6, G6), now. */
export function playChime() {
  if (!ctx) primeAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  chimeAt(ctx.currentTime + 0.05);
}

/**
 * Schedules the chime `seconds` from now on the audio clock, so it rings on
 * time even when the tab is in the background (page timers get throttled
 * there). Returns a cancel function, or null if audio isn't available.
 */
export function scheduleChime(seconds) {
  if (!ctx) primeAudio();
  if (!ctx) return null;
  const nodes = chimeAt(ctx.currentTime + Math.max(0.05, seconds));
  return () => {
    for (const node of nodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // Already stopped.
      }
    }
  };
}
