import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene} from './types';
import {Background} from './Background';
import {SceneView} from './scenes';
import {FontFaces} from './fonts';
import {C, FONT, SAFE} from './theme';

// 1080x1920 still for TikTok photo carousels, in the same "Lit Terminal" look as the reels.
// Reuses the reel scenes at their normal position (inside the Reels/TikTok safe zone),
// plus a slide counter on top and a swipe hint / logo at the bottom.
export type SlideProps = {scene: Scene; index: number; total: number; tag?: string};

export const Slide: React.FC<SlideProps> = ({scene, index, total, tag}) => {
  const last = index === total;
  return (
    <AbsoluteFill style={{backgroundColor: C.base, overflow: 'hidden'}}>
      <FontFaces />
      <Background />
      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          top: SAFE.top + 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONT.mono,
          fontSize: 26,
          color: C.text,
          padding: '12px 22px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${C.border}`,
        }}
      >
        <span style={{width: 10, height: 10, borderRadius: 5, background: C.green, boxShadow: `0 0 12px ${C.green}`}} />
        {tag ? `${tag} · ` : ''}
        {index}/{total}
      </div>
      <SceneView scene={scene} dur={150} />
      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: 1120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: FONT.mono,
          fontSize: 28,
          color: C.muted,
        }}
      >
        <span>
          <span style={{color: C.green}}>&gt; </span>
          <span style={{color: C.text}}>localhost</span>
        </span>
        {last ? null : <span>swipe →</span>}
      </div>
    </AbsoluteFill>
  );
};
