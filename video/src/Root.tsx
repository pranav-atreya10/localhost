import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {ReelProps} from './types';
import {FPS, H, W} from './theme';
import sample from './sample-props.json';

export const Root: React.FC = () => (
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
);
