import {Scene, Word} from './types';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\.(?=\s|$)/g, '')
    .trim();

// Find the time (seconds) where a phrase starts in the voiceover.
export const findPhraseTime = (words: Word[], phrase: string | undefined, fromIdx = 0): {t: number; idx: number} => {
  if (!phrase) return {t: 0, idx: 0};
  const target = norm(phrase).split(' ').filter(Boolean);
  const ws = words.map((w) => norm(w.text));
  for (let i = fromIdx; i < ws.length; i++) {
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (ws[i + j] !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return {t: words[i].start, idx: i};
  }
  throw new Error(`Scene phrase not found in voiceover: "${phrase}"`);
};

export const sceneStarts = (scenes: Scene[], words: Word[]): number[] => {
  let idx = 0;
  return scenes.map((s, i) => {
    if (i === 0) return 0;
    const r = findPhraseTime(words, s.at, idx);
    idx = r.idx;
    return r.t;
  });
};

// Group words into 1–3 word caption chunks, breaking on punctuation.
export const captionChunks = (words: Word[]) => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const endsPunct = /[.,!?;:—]$/.test(w.text);
    if (cur.length >= 3 || endsPunct) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks.map((c) => ({words: c, start: c[0].start, end: c[c.length - 1].end}));
};
