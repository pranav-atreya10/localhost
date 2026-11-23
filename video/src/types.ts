export type Word = {text: string; start: number; end: number};

export type Scene =
  | {type: 'hook'; at?: string; text: string; sub?: string}
  | {type: 'statement'; at: string; big: string; small?: string; chips?: string[]}
  | {type: 'code'; at: string; title?: string; lines: string[]; highlight?: number; note?: string}
  | {type: 'list'; at: string; title?: string; items: {text: string; status?: 'ok' | 'bad' | 'none'}[]}
  | {type: 'flow'; at: string; title?: string; nodes: string[]}
  | {
      type: 'pair';
      at: string;
      left: string;
      right: string;
      messages: {dir: 'right' | 'left'; label: string}[];
      result?: string;
    }
  | {
      type: 'compare';
      at: string;
      left: {label: string; value: string};
      right: {label: string; value: string};
      verdict?: string;
      verdictTone?: 'ok' | 'bad';
    }
  | {type: 'shirt'; at: string; item: 'tee' | 'hoodie'; joke?: string; accent?: string; line?: string}
  | {type: 'end'; at: string; text: string; sub?: string};

export type ReelProps = {
  id: string;
  seriesBadge: string; // e.g. "you_hit_enter · 1/3"
  scenes: Scene[];
  keywords: string[];
  words: Word[];
  audioDuration: number; // seconds
  voiceSrc: string | null; // file in public/
  musicSrc: string | null; // file in public/
};
