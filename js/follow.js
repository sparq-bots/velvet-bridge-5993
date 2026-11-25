// Follow-along: which verse is being read right now.
//
// No timing files exist yet, so the position is worked out while the audio
// plays. A first guess comes from text length (longer verses take longer to
// read). Readers pause between verses, so wherever the browser can listen to
// the audio (Chrome, Edge, Android), each pause it hears "anchors" the next
// verse to the real time it started. Every guess after that is re-spread
// between the anchors, so the highlight stays in step instead of drifting.
// Nothing is downloaded twice: the analysis taps the audio already playing.

export class Follower {
  constructor(aud) {
    this.aud = aud;
    this.ctx = null; this.an = null; this.buf = null; this.timer = 0;
    this.can = typeof aud.captureStream === 'function' && !!(window.AudioContext || window.webkitAudioContext);
    this.reset(0);
  }

  // weights: one number per verse (its length); call when a chapter is shown.
  reset(n, weights = []) {
    this.n = n;
    this.cum = [0];
    for (let i = 0; i < n; i++) this.cum.push(this.cum[i] + Math.max(12, weights[i] || 0));
    this.anchors = new Map();          // verse index → start time (seconds)
    this.soft0 = true;                 // start of verse 1 is only a guess so far
    this.quiet = 0; this.loud = 0; this.level = 0; this.sinceSound = 0;
  }

  // Start listening (call from a user gesture, e.g. the play button).
  listen() {
    if (!this.can || this.ctx === false) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.an = this.ctx.createAnalyser();
        this.an.fftSize = 1024;
        this.buf = new Float32Array(this.an.fftSize);
        this.src = null;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      // captureStream() gives a copy of the sound; the speaker output is untouched.
      const stream = this.aud.captureStream();
      if (this.stream !== stream || !this.src) {
        this.src?.disconnect();
        this.src = this.ctx.createMediaStreamSource(stream);
        this.src.connect(this.an);
        this.stream = stream;
      }
      clearInterval(this.timer);
      this.timer = setInterval(() => this.sample(), 40);
    } catch { this.ctx = false; }        // not supported here: estimate only
  }
  stop() { clearInterval(this.timer); this.timer = 0; }

  sample() {
    const a = this.aud;
    if (a.paused || !this.n || !(a.duration > 0)) return;
    this.an.getFloatTimeDomainData(this.buf);
    let s = 0;
    for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(s / this.buf.length);
    if (rms > 0.02) this.loud = this.loud ? this.loud * 0.97 + rms * 0.03 : rms;   // typical speech level
    const silent = rms < Math.max(0.006, this.loud * 0.12);
    const t = a.currentTime;
    if (silent) { if (!this.quiet) this.quiet = t; return; }
    // Sound again: was the gap long enough to be a pause between verses?
    if (this.quiet && t - this.quiet >= 0.28) this.pause(t);
    this.quiet = 0;
  }

  // A pause ended at time t: the verse whose estimated start is closest begins here.
  pause(t) {
    const dur = this.aud.duration;
    // The chapter title is read first; the first clear pause near the start ends it.
    if (this.soft0 && t < Math.min(12, dur * 0.15) && t <= this.start(1) * 0.9) {
      this.anchors.set(0, t); this.soft0 = false; return;
    }
    let best = -1, gap = Infinity;
    for (let j = 1; j < this.n; j++) {
      if (this.anchors.has(j)) continue;
      const d = Math.abs(this.start(j) - t);
      if (d < gap) { gap = d; best = j; }
    }
    if (best < 0) return;
    const len = this.start(best) - this.start(best - 1);
    if (gap > Math.max(2.5, len * 0.4)) return;          // too far from any verse start
    // Keep anchors in order: never place a verse before an earlier anchored one.
    for (const [j, at] of this.anchors) if ((j < best && at >= t) || (j > best && at <= t)) return;
    this.anchors.set(best, t);
  }

  // Estimated start time of verse j (0-based), spread between known anchors.
  start(j) {
    const dur = this.aud.duration || 0;
    const pts = [[0, this.anchors.get(0) ?? Math.min(4, dur * 0.04)], ...[...this.anchors].filter(([k]) => k > 0), [this.n, dur]]
      .sort((x, y) => x[0] - y[0]);
    let lo = pts[0], hi = pts[pts.length - 1];
    for (const p of pts) { if (p[0] <= j) lo = p; if (p[0] >= j) { hi = p; break; } }
    if (hi[0] === lo[0]) return lo[1];
    const f = (this.cum[j] - this.cum[lo[0]]) / (this.cum[hi[0]] - this.cum[lo[0]]);
    return lo[1] + f * (hi[1] - lo[1]);
  }

  // Index of the verse being read at the current time. While pauses can be
  // heard, the highlight waits for the pause before moving on (with some
  // slack in case a reader runs two verses together), so it doesn't jump ahead.
  current() {
    const t = this.aud.currentTime;
    const hearing = this.timer && this.loud > 0;
    let i = 0;
    for (let j = 1; j < this.n; j++) {
      let at = this.start(j);
      if (hearing && !this.anchors.has(j)) at += Math.max(1.5, (at - this.start(j - 1)) * 0.35);
      if (at <= t) i = j; else break;
    }
    return i;
  }
}
