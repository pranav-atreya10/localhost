import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Scene} from './types';
import {C, FONT, SAFE, SAFE_W, STAGE} from './theme';
import {Cursor, Glass, Label, Rise, Typed} from './anim';

const Stage: React.FC<{children: React.ReactNode; align?: 'center' | 'start'}> = ({children, align = 'center'}) => (
  <div
    style={{
      position: 'absolute',
      left: SAFE.left,
      width: SAFE_W,
      top: STAGE.top,
      height: STAGE.bottom - STAGE.top,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
    }}
  >
    {children}
  </div>
);

const fitSize = (text: string, max: number, min: number) => {
  const len = text.length;
  if (len <= 14) return max;
  if (len <= 24) return Math.round(max * 0.82);
  if (len <= 36) return Math.round(max * 0.68);
  return Math.max(min, Math.round(max * 0.56));
};

const Hook: React.FC<{text: string; sub?: string}> = ({text, sub}) => {
  const words = text.split(' ');
  const size = fitSize(text, 112, 64);
  return (
    <Stage>
      <div
        style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: '-0.035em',
          color: C.text,
        }}
      >
        {words.map((w, i) => (
          <Rise key={i} delay={i * 3} style={{display: 'inline-block', marginRight: '0.24em'}}>
            {w}
          </Rise>
        ))}
        <Cursor />
      </div>
      {sub ? (
        <Rise delay={words.length * 3 + 6}>
          <div style={{fontFamily: FONT.mono, fontSize: 30, color: C.muted, marginTop: 36}}>{sub}</div>
        </Rise>
      ) : null}
    </Stage>
  );
};

const Statement: React.FC<{big: string; small?: string; chips?: string[]}> = ({big, small, chips}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const size = fitSize(big, 92, 54);
  return (
    <Stage>
      <Rise>
        <div
          style={{
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: C.text,
          }}
        >
          {big}
        </div>
      </Rise>
      {small ? (
        <Rise delay={10}>
          <Glass style={{marginTop: 40, padding: '26px 30px'}}>
            <div style={{fontFamily: FONT.mono, fontSize: 32, color: C.text}}>{small}</div>
          </Glass>
        </Rise>
      ) : null}
      {chips?.length ? (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 34}}>
          {chips.map((c, i) => {
            const p = spring({frame: f - 16 - i * 8, fps, config: {damping: 16}});
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `scale(${0.9 + p * 0.1})`,
                  fontFamily: FONT.mono,
                  fontSize: 28,
                  color: C.text,
                  padding: '12px 22px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${C.border}`,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      ) : null}
    </Stage>
  );
};

const lineColor = (l: string) => {
  if (l.trim().startsWith('//')) return C.muted;
  if (l.includes('✗')) return C.red;
  if (l.includes('✓')) return C.green;
  return C.text;
};

const Code: React.FC<{title?: string; lines: string[]; highlight?: number; note?: string}> = ({
  title,
  lines,
  highlight,
  note,
}) => {
  const f = useCurrentFrame();
  // Each line starts after the previous finishes typing.
  let start = 8;
  const starts = lines.map((l) => {
    const s = start;
    start += Math.ceil(l.length / 2) + 6;
    return s;
  });
  const fontSize = Math.max(26, Math.min(36, Math.floor(1300 / Math.max(...lines.map((l) => l.length), 20))));
  return (
    <Stage>
      <Rise>
        <Glass glow style={{padding: '30px 34px 34px', transform: 'perspective(1400px) rotateX(6deg)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.14)'}} />
            ))}
            {title ? (
              <div style={{fontFamily: FONT.mono, fontSize: 24, color: C.muted, marginLeft: 14}}>{title}</div>
            ) : null}
          </div>
          {lines.map((l, i) => {
            const active = highlight === i && f > starts[i];
            return (
              <div
                key={i}
                style={{
                  fontFamily: FONT.mono,
                  fontSize,
                  lineHeight: 1.55,
                  color: lineColor(l),
                  whiteSpace: 'pre',
                  paddingLeft: 18,
                  borderLeft: `4px solid ${active ? C.green : 'transparent'}`,
                  textShadow: active ? `0 0 22px rgba(57,255,20,0.35)` : undefined,
                  minHeight: fontSize * 1.55,
                }}
              >
                <Typed text={l} delay={starts[i]} />
              </div>
            );
          })}
        </Glass>
      </Rise>
      {note ? (
        <Rise delay={start}>
          <div style={{fontFamily: FONT.mono, fontSize: 24, color: C.muted, marginTop: 22}}>{note}</div>
        </Rise>
      ) : null}
    </Stage>
  );
};

const List: React.FC<{title?: string; items: {text: string; status?: 'ok' | 'bad' | 'none'}[]}> = ({title, items}) => (
  <Stage>
    <Rise>
      <Glass style={{padding: '34px 36px'}}>
        {title ? <Label>{title}</Label> : null}
        {items.map((it, i) => {
          const color = it.status === 'ok' ? C.green : it.status === 'bad' ? C.red : C.cyan;
          const mark = it.status === 'ok' ? '✓' : it.status === 'bad' ? '✗' : '›';
          return (
            <Rise key={i} delay={10 + i * 14}>
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  alignItems: 'baseline',
                  padding: '16px 0',
                  borderTop: i ? `1px solid ${C.border}` : undefined,
                }}
              >
                <span style={{fontFamily: FONT.mono, fontSize: 34, color, width: 34}}>{mark}</span>
                <span style={{fontFamily: FONT.sans, fontWeight: 600, fontSize: 40, color: C.text, letterSpacing: '-0.01em'}}>
                  {it.text}
                </span>
              </div>
            </Rise>
          );
        })}
      </Glass>
    </Rise>
  </Stage>
);

const Flow: React.FC<{title?: string; nodes: string[]; dur: number}> = ({title, nodes, dur}) => {
  const f = useCurrentFrame();
  const n = nodes.length;
  const gap = Math.min(150, Math.floor(560 / Math.max(n - 1, 1)));
  const nodeH = 76;
  const revealEach = Math.max(10, Math.floor((dur * 0.55) / n));
  const totalH = (n - 1) * gap + nodeH;
  // dot goes down then back up
  const down = interpolate(f, [revealEach * n, revealEach * n + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const up = interpolate(f, [revealEach * n + 46, revealEach * n + 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dotY = up > 0 ? (1 - up) * (totalH - nodeH) : down * (totalH - nodeH);
  const dotColor = up > 0 ? C.cyan : C.green;
  return (
    <Stage>
      {title ? (
        <Rise>
          <Label>{title}</Label>
        </Rise>
      ) : null}
      <div style={{position: 'relative', height: totalH}}>
        {/* spine */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: nodeH / 2,
            width: 3,
            height: interpolate(f, [0, revealEach * n], [0, totalH - nodeH], {extrapolateRight: 'clamp'}),
            background: `linear-gradient(${C.green}, ${C.cyan})`,
            opacity: 0.6,
          }}
        />
        {down > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: 61.5 - 12,
              top: nodeH / 2 - 12 + dotY,
              width: 24,
              height: 24,
              borderRadius: 12,
              background: dotColor,
              boxShadow: `0 0 30px ${dotColor}`,
            }}
          />
        ) : null}
        {nodes.map((node, i) => (
          <div key={i} style={{position: 'absolute', top: i * gap, left: 0, right: 0}}>
            <Rise delay={i * revealEach}>
              <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
                <div
                  style={{
                    width: 122,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      border: `3px solid ${i === 0 ? C.green : C.cyan}`,
                      background: C.base,
                      marginLeft: -60,
                    }}
                  />
                </div>
                <Glass style={{padding: '0 28px', height: nodeH, display: 'flex', alignItems: 'center', marginLeft: -90}}>
                  <span style={{fontFamily: FONT.mono, fontSize: 32, color: C.text}}>{node}</span>
                </Glass>
              </div>
            </Rise>
          </div>
        ))}
      </div>
    </Stage>
  );
};

const Pair: React.FC<{
  left: string;
  right: string;
  messages: {dir: 'right' | 'left'; label: string}[];
  result?: string;
  dur: number;
}> = ({left, right, messages, result, dur}) => {
  const f = useCurrentFrame();
  const each = Math.max(18, Math.floor((dur * 0.6) / Math.max(messages.length, 1)));
  const boxW = 200;
  const laneTop = 120;
  const rowH = Math.min(110, Math.floor(420 / Math.max(messages.length, 1)));
  return (
    <Stage align="start">
      <div style={{position: 'relative', height: 600, marginTop: 20}}>
        {[left, right].map((name, i) => (
          <Rise key={name} delay={i * 4} style={{position: 'absolute', top: 0, left: i ? SAFE_W - boxW : 0, width: boxW}}>
            <Glass glow={i === 0} style={{height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontFamily: FONT.mono, fontSize: 32, color: i ? C.cyan : C.green}}>{name}</span>
            </Glass>
          </Rise>
        ))}
        {/* lifelines */}
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 90,
              left: i ? SAFE_W - boxW / 2 : boxW / 2,
              width: 2,
              height: 470,
              background: 'rgba(255,255,255,0.10)',
            }}
          />
        ))}
        {messages.map((m, i) => {
          const s = 12 + i * each;
          const p = interpolate(f, [s, s + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const x0 = boxW / 2;
          const x1 = SAFE_W - boxW / 2;
          const color = m.dir === 'right' ? C.green : C.cyan;
          const len = (x1 - x0) * p;
          const y = laneTop + i * rowH + 40;
          return (
            <div key={i} style={{position: 'absolute', top: y, left: 0, width: SAFE_W, opacity: p > 0 ? 1 : 0}}>
              <div
                style={{
                  position: 'absolute',
                  top: -46,
                  left: 0,
                  width: SAFE_W,
                  textAlign: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 30,
                  color,
                  opacity: p,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: m.dir === 'right' ? x0 : x1 - len,
                  width: len,
                  height: 3,
                  background: color,
                  boxShadow: `0 0 16px ${color}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: -9,
                  left: m.dir === 'right' ? x0 + len - 12 : x1 - len - 8,
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  [m.dir === 'right' ? 'borderLeft' : 'borderRight']: `16px solid ${color}`,
                  opacity: p,
                }}
              />
            </div>
          );
        })}
        {result ? (
          <Rise delay={12 + messages.length * each} style={{position: 'absolute', top: 500, left: 0, width: SAFE_W}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 30,
                  color: C.base,
                  background: C.green,
                  padding: '10px 22px',
                  borderRadius: 999,
                  boxShadow: `0 0 30px rgba(57,255,20,0.4)`,
                }}
              >
                {result}
              </div>
            </div>
          </Rise>
        ) : null}
      </div>
    </Stage>
  );
};

const Compare: React.FC<{
  left: {label: string; value: string};
  right: {label: string; value: string};
  verdict?: string;
  verdictTone?: 'ok' | 'bad';
}> = ({left, right, verdict, verdictTone}) => {
  const tone = verdictTone === 'bad' ? C.red : C.green;
  return (
    <Stage>
      <div style={{display: 'flex', gap: 24}}>
        {[left, right].map((s, i) => (
          <Rise key={i} delay={i * 8} style={{flex: 1}}>
            <Glass style={{padding: '28px 26px', minHeight: 220}}>
              <Label>{s.label}</Label>
              <div style={{fontFamily: FONT.mono, fontSize: 34, color: C.text, overflowWrap: 'anywhere', lineHeight: 1.35}}>
                {s.value}
              </div>
            </Glass>
          </Rise>
        ))}
      </div>
      {verdict ? (
        <Rise delay={22}>
          <div
            style={{
              marginTop: 40,
              fontFamily: FONT.sans,
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: '-0.03em',
              color: C.text,
            }}
          >
            <span style={{borderBottom: `6px solid ${tone}`, paddingBottom: 4}}>{verdict}</span>
          </div>
        </Rise>
      ) : null}
    </Stage>
  );
};

const End: React.FC<{text: string; sub?: string}> = ({text, sub}) => (
  <Stage>
    <Rise>
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: fitSize(text, 76, 46),
          color: C.text,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}
      >
        <span style={{color: C.green}}>&gt; </span>
        {text}
        <Cursor />
      </div>
    </Rise>
    {sub ? (
      <Rise delay={10}>
        <div style={{fontFamily: FONT.sans, fontSize: 36, color: C.muted, marginTop: 30}}>{sub}</div>
      </Rise>
    ) : null}
  </Stage>
);

export const SceneView: React.FC<{scene: Scene; dur: number}> = ({scene, dur}) => {
  switch (scene.type) {
    case 'hook':
      return <Hook text={scene.text} sub={scene.sub} />;
    case 'statement':
      return <Statement big={scene.big} small={scene.small} chips={scene.chips} />;
    case 'code':
      return <Code title={scene.title} lines={scene.lines} highlight={scene.highlight} note={scene.note} />;
    case 'list':
      return <List title={scene.title} items={scene.items} />;
    case 'flow':
      return <Flow title={scene.title} nodes={scene.nodes} dur={dur} />;
    case 'pair':
      return <Pair left={scene.left} right={scene.right} messages={scene.messages} result={scene.result} dur={dur} />;
    case 'compare':
      return <Compare left={scene.left} right={scene.right} verdict={scene.verdict} verdictTone={scene.verdictTone} />;
    case 'end':
      return <End text={scene.text} sub={scene.sub} />;
  }
};
