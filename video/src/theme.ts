// "Lit Terminal" — the localhost reel look.
export const C = {
  base: '#07090C',
  surface: '#0F1216',
  surface2: '#161A20',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.04)',
  text: '#F5F5F0',
  muted: '#8A919C',
  green: '#39FF14',
  cyan: '#5CE1E6',
  navy: '#1B2A4A',
  red: '#FF5C5C',
};

export const FONT = {
  sans: 'Geist, Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// Safe zone for 1080x1920 (Reels + Shorts UI). Keep text inside.
export const SAFE = {left: 120, right: 850, top: 290, bottom: 1250};
export const SAFE_W = SAFE.right - SAFE.left;

// Scene content area (badge sits above, captions below).
export const STAGE = {top: 400, bottom: 1000};
// Kinetic caption band.
export const CAPTION_Y = 1060;

export const FPS = 30;
export const W = 1080;
export const H = 1920;
