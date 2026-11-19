import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, EASE_IN_OUT} from './theme';

// Rise from blur: the house entrance.
export const Rise: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - delay, fps, config: {damping: 18, mass: 0.8}});
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        filter: `blur(${(1 - p) * 12}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: boolean}> = ({
  children,
  style,
  glow,
}) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.045)',
      border: `1px solid ${C.border}`,
      borderRadius: 24,
      boxShadow: glow
        ? `0 0 0 1px rgba(57,255,20,0.18), 0 20px 60px rgba(0,0,0,0.45), 0 0 80px rgba(57,255,20,0.08)`
        : '0 20px 60px rgba(0,0,0,0.45)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Cursor: React.FC<{size?: number}> = ({size = 1}) => {
  const f = useCurrentFrame();
  const on = Math.floor(f / 15) % 2 === 0;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 0.55 * size + 'em',
        height: '1em',
        marginLeft: '0.12em',
        verticalAlign: '-0.12em',
        background: C.green,
        opacity: on ? 1 : 0,
        boxShadow: `0 0 18px ${C.green}`,
      }}
    />
  );
};

// Typed text, ~2 chars/frame.
export const Typed: React.FC<{text: string; delay?: number; speed?: number; style?: React.CSSProperties}> = ({
  text,
  delay = 0,
  speed = 2,
  style,
}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.floor((f - delay) * speed));
  return <span style={style}>{text.slice(0, n)}</span>;
};

export const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.muted}) => (
  <div style={{fontFamily: FONT.mono, fontSize: 26, color, letterSpacing: '0.02em', marginBottom: 18}}>{children}</div>
);

export const fadeOut = (frame: number, dur: number) =>
  interpolate(frame, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT});
