import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene} from './types';
import {Background} from './Background';
import {SceneView} from './scenes';
import {FontFaces} from './fonts';
import {C, FONT, SAFE, STAGE} from './theme';

// 1080x1080 image card for X, in the same "Lit Terminal" look as the reels.
// Reuses the reel scenes: the 730px-wide stage is centered and moved up into the square.
export type CardProps = {scene: Scene};

const CARD = 1080;
const STAGE_H = STAGE.bottom - STAGE.top;

export const Card: React.FC<CardProps> = ({scene}) => {
  const dx = (CARD - (SAFE.right - SAFE.left)) / 2 - SAFE.left;
  const dy = (CARD - STAGE_H) / 2 - STAGE.top - 30;
  return (
    <AbsoluteFill style={{backgroundColor: C.base, overflow: 'hidden'}}>
      <FontFaces />
      <Background />
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px)`}}>
        <SceneView scene={scene} dur={150} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 56,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: FONT.mono,
          fontSize: 30,
          color: C.muted,
          gap: 6,
        }}
      >
        <span style={{color: C.green}}>&gt;</span>
        <span style={{color: C.text}}>localhost</span>
        <span style={{display: 'inline-block', width: 16, height: 30, background: C.green, marginLeft: 4}} />
      </div>
    </AbsoluteFill>
  );
};
