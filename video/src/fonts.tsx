import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, number, string][] = [
  ['Geist', 400, 'geist-latin-400-normal.woff2'],
  ['Geist', 600, 'geist-latin-600-normal.woff2'],
  ['Geist', 700, 'geist-latin-700-normal.woff2'],
  ['JetBrains Mono', 400, 'jetbrains-mono-latin-400-normal.woff2'],
  ['JetBrains Mono', 500, 'jetbrains-mono-latin-500-normal.woff2'],
  ['JetBrains Mono', 700, 'jetbrains-mono-latin-700-normal.woff2'],
];

let loaded = false;
const load = () => {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(([family, weight, file]) => {
      const ff = new FontFace(family, `url(${staticFile('fonts/' + file)}) format('woff2')`, {weight: String(weight)});
      return ff.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

export const FontFaces: React.FC = () => {
  load();
  return null;
};
