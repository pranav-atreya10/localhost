import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Word} from './types';
import {captionChunks} from './timing';
import {C, CAPTION_Y, FONT, SAFE, SAFE_W} from './theme';

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const Captions: React.FC<{words: Word[]; keywords: string[]}> = ({words, keywords}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const chunks = React.useMemo(() => captionChunks(words), [words]);
  const kw = React.useMemo(() => new Set(keywords.flatMap((k) => k.split(' ')).map(clean).filter(Boolean)), [keywords]);
  const idx = chunks.findIndex((c, i) => t >= c.start - 0.05 && (i === chunks.length - 1 || t < chunks[i + 1].start - 0.05));
  if (idx < 0) return null;
  const chunk = chunks[idx];
  if (t > chunk.end + 0.6) return null;
  const startF = Math.round(chunk.start * fps);
  const p = spring({frame: f - startF, fps, config: {damping: 20, mass: 0.6}});
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        width: SAFE_W,
        top: CAPTION_Y,
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0 18px',
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {chunk.words.map((w, i) => {
        const spoken = t >= w.start - 0.03;
        const isKw = kw.has(clean(w.text));
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT.sans,
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: '-0.02em',
              color: spoken ? C.text : 'rgba(245,245,240,0.45)',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
              borderBottom: isKw ? `7px solid ${C.green}` : '7px solid transparent',
              paddingBottom: 2,
              boxShadow: isKw ? `0 10px 24px -14px ${C.green}` : undefined,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
