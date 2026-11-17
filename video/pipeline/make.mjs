// Picks the next reel script, makes the voiceover (ElevenLabs), renders the video (Remotion).
// Usage: node pipeline/make.mjs [--dry] [--file content/queue/xyz.json]
//   --dry  fake voice (silence + estimated timings) so you can test the look without using credits.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, VIDEO_DIR, QUEUE, POSTED, OUT, SITE, config, listJson, readJson, writeJson, validateReel} from './lib.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

const setOutput = (k, v) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
};

const queue = listJson(QUEUE);
const scriptPath = fileArg ? path.resolve(ROOT, fileArg) : queue.length ? path.join(QUEUE, queue[0]) : null;
if (!scriptPath) {
  console.log('Queue is empty — nothing to make.');
  setOutput('ready', 'false');
  process.exit(0);
}
const script = readJson(scriptPath);
const postedIds = listJson(POSTED).map((f) => readJson(path.join(POSTED, f)).id);
const errs = validateReel(script, fileArg ? [] : postedIds);
if (errs.length) {
  console.error(`Script ${path.basename(scriptPath)} failed checks:\n- ` + errs.join('\n- '));
  process.exit(1);
}

const GEN = path.join(VIDEO_DIR, 'public', 'gen');
fs.rmSync(GEN, {recursive: true, force: true});
fs.mkdirSync(GEN, {recursive: true});
fs.mkdirSync(OUT, {recursive: true});

// ---------- voice ----------
const wordsFromAlignment = (a) => {
  const words = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = {text: '', start: a.character_start_times_seconds[i], end: 0};
    cur.text += ch;
    cur.end = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  // fold pure-punctuation tokens (like "—") into the previous word
  const out = [];
  for (const w of words) {
    if (!/[a-z0-9]/i.test(w.text) && out.length) {
      out[out.length - 1].end = w.end;
      continue;
    }
    out.push(w);
  }
  return out;
};

const audioDuration = (file) =>
  parseFloat(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(),
  );

let words;
let duration;
const voiceFile = path.join(GEN, 'voice.mp3');
if (DRY) {
  let t = 0.15;
  words = script.voiceover
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => /[a-z0-9]/i.test(w))
    .map((w) => {
      const d = 0.16 + w.length * 0.045 + (/[.,!?]$/.test(w) ? 0.22 : 0);
      const word = {text: w, start: t, end: t + d - 0.04};
      t += d;
      return word;
    });
  duration = t + 0.3;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(duration), voiceFile]);
} else {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set');
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        text: script.voiceover,
        model_id: config.elevenlabs.modelId,
        voice_settings: config.elevenlabs.voiceSettings,
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  fs.writeFileSync(voiceFile, Buffer.from(data.audio_base64, 'base64'));
  words = wordsFromAlignment(data.alignment);
  duration = audioDuration(voiceFile);
  if (!(duration > 5) || words.length < 20) throw new Error(`Voiceover looks broken (${duration}s, ${words.length} words) — not posting a silent video`);
}

// ---------- music (generated, so it's 100% copyright-free) ----------
const roots = [110, 98, 116.54, 103.83, 123.47]; // A2, G2, A#2, G#2, B2
const seed = [...script.id].reduce((a, c) => a + c.charCodeAt(0), 0);
const r = roots[seed % roots.length];
const musicFile = path.join(GEN, 'music.mp3');
const expr = [
  `0.22*sin(2*PI*${r}*t)*(0.65+0.35*sin(2*PI*0.08*t))`,
  `0.14*sin(2*PI*${(r * 1.5).toFixed(2)}*t)*(0.6+0.4*sin(2*PI*0.11*t+1))`,
  `0.11*sin(2*PI*${(r * 2).toFixed(2)}*t)`,
  `0.07*sin(2*PI*${(r * 2.378).toFixed(2)}*t)*(0.5+0.5*sin(2*PI*0.06*t+2))`,
  `0.05*sin(2*PI*${(r * 3).toFixed(2)}*t)*(0.5+0.5*sin(2*PI*0.17*t))`,
].join('+');
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${Math.ceil(duration + 3)}`,
  '-af', 'lowpass=f=1600,aecho=0.8:0.6:420|700:0.25|0.18,afade=t=in:d=1.5,loudnorm=I=-16:TP=-2:LRA=7', musicFile,
]);

// ---------- render ----------
const props = {
  id: script.id,
  seriesBadge: script.seriesBadge,
  scenes: script.scenes,
  keywords: script.keywords,
  words,
  audioDuration: duration,
  voiceSrc: 'gen/voice.mp3',
  musicSrc: 'gen/music.mp3',
};
const propsFile = path.join(OUT, 'props.json');
writeJson(propsFile, props);
const outFile = path.join(OUT, `${script.id}.mp4`);
const browser = process.env.REMOTION_BROWSER ? ['--browser-executable', process.env.REMOTION_BROWSER] : [];
execFileSync(
  'npx',
  ['remotion', 'render', 'src/index.ts', 'Reel', outFile, `--props=${propsFile}`, '--codec=h264', '--crf=20', '--audio-codec=aac', ...browser],
  {cwd: VIDEO_DIR, stdio: 'inherit'},
);

// ---------- stage for hosting ----------
fs.rmSync(SITE, {recursive: true, force: true});
fs.mkdirSync(path.join(SITE, 'videos'), {recursive: true});
fs.copyFileSync(outFile, path.join(SITE, 'videos', `${script.id}.mp4`));
fs.writeFileSync(path.join(SITE, 'index.html'), '<!doctype html><title>localhost media</title><p>media host for @localhost.wear</p>');
writeJson(path.join(OUT, 'plan.json'), {scriptPath: path.relative(ROOT, scriptPath), id: script.id, video: `videos/${script.id}.mp4`, duration});
setOutput('ready', 'true');
console.log(`Made ${script.id} (${duration.toFixed(1)}s)`);
