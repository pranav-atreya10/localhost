import React from 'react';
import {Composition} from 'remotion';
import {Card} from './Card';
import {Reel} from './Reel';
import {Slide} from './Slide';
import {ReelProps} from './types';
import {FPS, H, W} from './theme';
import sample from './sample-props.json';

export const Root: React.FC = () => (
  <>
  <Composition
    id="Reel"
    component={Reel as unknown as React.FC<Record<string, unknown>>}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={300}
    defaultProps={sample as unknown as Record<string, unknown>}
    calculateMetadata={({props}) => {
      const p = props as unknown as ReelProps;
      return {durationInFrames: Math.ceil((p.audioDuration + 1.6) * FPS)};
    }}
  />
  <Composition
    id="Card"
    component={Card as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1080}
    fps={FPS}
    durationInFrames={150}
    defaultProps={{scene: {type: 'statement', at: '', big: 'DNS = the internet\'s contacts app', small: 'example.com → 203.0.113.42'}}}
  />
  <Composition
    id="Slide"
    component={Slide as unknown as React.FC<Record<string, unknown>>}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={150}
    defaultProps={{index: 1, total: 6, tag: 'dev pain', scene: {type: 'hook', text: 'junior vs senior dev', sub: 'same bug. different energy.'}}}
  />
  </>
);
