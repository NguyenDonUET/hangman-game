import type { Cue } from "../game/soundCue";

type Note = {
  frequency: number;
  start: number;
  duration: number;
  wave?: OscillatorType;
  peak?: number;
  slideTo?: number;
};

const CUES: Record<Cue, readonly Note[]> = {
  hit: [
    { frequency: 659, start: 0, duration: 0.09 },
    { frequency: 880, start: 0.07, duration: 0.14 },
  ],
  miss: [{ frequency: 220, start: 0, duration: 0.28, wave: "square", peak: 0.08, slideTo: 110 }],
  win: [
    { frequency: 523, start: 0, duration: 0.14 },
    { frequency: 659, start: 0.12, duration: 0.14 },
    { frequency: 784, start: 0.24, duration: 0.14 },
    { frequency: 1047, start: 0.36, duration: 0.5, peak: 0.25 },
  ],
  lose: [
    { frequency: 392, start: 0, duration: 0.26 },
    { frequency: 370, start: 0.26, duration: 0.26 },
    { frequency: 349, start: 0.52, duration: 0.26 },
    { frequency: 330, start: 0.78, duration: 0.7, slideTo: 165 },
  ],
};

let context: AudioContext | null = null;
let master: GainNode | null = null;

function output(): { context: AudioContext; master: GainNode } | null {
  if (typeof AudioContext === "undefined") return null;
  if (!context || !master) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return { context, master };
}

function schedule(context: AudioContext, master: GainNode, note: Note, at: number) {
  const begin = at + note.start;
  const end = begin + note.duration;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = note.wave ?? "triangle";
  oscillator.frequency.setValueAtTime(note.frequency, begin);
  if (note.slideTo) oscillator.frequency.exponentialRampToValueAtTime(note.slideTo, end);

  // Exponential ramps cannot reach 0, and an instant jump to full gain clicks.
  envelope.gain.setValueAtTime(0.0001, begin);
  envelope.gain.exponentialRampToValueAtTime(note.peak ?? 0.2, begin + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(envelope).connect(master);
  oscillator.start(begin);
  oscillator.stop(end + 0.02);
}

export function playCue(cue: Cue) {
  const audio = output();
  if (!audio) return;
  const at = audio.context.currentTime;
  for (const note of CUES[cue]) schedule(audio.context, audio.master, note, at);
}
