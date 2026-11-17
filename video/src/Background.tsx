import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, W, H} from './theme';

const Blob: React.FC<{color: string; size: number; x: number; y: number; phase: number; opacity: number}> = ({
  color,
  size,
  x,
  y,
  phase,
  opacity,
}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const dx = Math.sin(t * 0.25 + phase) * 140;
  const dy = Math.cos(t * 0.18 + phase * 1.7) * 180;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + dx - size / 2,
        top: y + dy - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        opacity,
      }}
    />
  );
};

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: C.base, overflow: 'hidden'}}>
      <Blob color={C.green} size={1100} x={250} y={450} phase={0} opacity={0.16} />
      <Blob color={C.cyan} size={1000} x={850} y={1250} phase={2.1} opacity={0.14} />
      <Blob color={C.navy} size={1300} x={600} y={1700} phase={4.2} opacity={0.55} />
      {/* dot grid */}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px',
          backgroundPosition: `0px ${(f * 0.3) % 48}px`,
          opacity: 0.6,
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.65) 100%)'}}
      />
      {/* animated grain */}
      <AbsoluteFill style={{opacity: 0.05, mixBlendMode: 'overlay'}}>
        <svg width={W} height={H}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 6) % 4} stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
