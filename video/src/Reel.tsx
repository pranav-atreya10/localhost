import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ReelProps} from './types';
import {Background} from './Background';
import {SceneView} from './scenes';
import {Captions} from './Captions';
import {sceneStarts} from './timing';
import {C, FONT, SAFE} from './theme';
import {FontFaces} from './fonts';

const TRANSITION = 10; // frames of push/blur between scenes

const SceneWrap: React.FC<{children: React.ReactNode; dur: number; isLast: boolean}> = ({children, dur, isLast}) => {
  const f = useCurrentFrame();
  const out = isLast ? 0 : interpolate(f, [dur - TRANSITION, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform: `translateY(${-out * 60}px) scale(${1 - out * 0.03})`,
        filter: `blur(${out * 14}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Badge: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [6, 20], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        top: SAFE.top + 10,
        opacity: o,
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
      {text}
    </div>
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const {fps, durationInFrames} = useVideoConfig();
  const starts = sceneStarts(props.scenes, props.words).map((t) => Math.round(t * fps));
  return (
    <AbsoluteFill style={{backgroundColor: C.base}}>
      <FontFaces />
      <Background />
      {props.scenes.map((s, i) => {
        const from = starts[i];
        const to = i === props.scenes.length - 1 ? durationInFrames : starts[i + 1] + TRANSITION / 2;
        const dur = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <SceneWrap dur={dur} isLast={i === props.scenes.length - 1}>
              <SceneView scene={s} dur={dur} />
            </SceneWrap>
          </Sequence>
        );
      })}
      <Badge text={props.seriesBadge} />
      <Captions words={props.words} keywords={props.keywords} />
      {props.voiceSrc ? <Audio src={staticFile(props.voiceSrc)} /> : null}
      {props.musicSrc ? <Audio src={staticFile(props.musicSrc)} volume={0.22} loop /> : null}
    </AbsoluteFill>
  );
};
