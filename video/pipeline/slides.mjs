// Renders the 1080x1920 JPEG slides for the TikTok carousels this run will schedule,
// saves them in media/slides/ (kept in git so they stay hosted until they post), and stages all slides in site/.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {VIDEO_DIR, TT_QUEUE, TT_POSTED, OUT, SITE, SLIDES, listJson, readJson, writeJson, openTTSlots, slideName} from './lib.mjs';

const setOutput = (k, v) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
};
const all = process.argv.includes('--all'); // render every queued carousel (for previews)
const browser = process.env.REMOTION_BROWSER ? ['--browser-executable', process.env.REMOTION_BROWSER] : [];

fs.mkdirSync(SLIDES, {recursive: true});
fs.mkdirSync(OUT, {recursive: true});
const upcoming = listJson(TT_QUEUE).slice(0, all ? undefined : openTTSlots().length);
let made = 0;
for (const f of upcoming) {
  const item = readJson(path.join(TT_QUEUE, f));
  item.slides.forEach((scene, i) => {
    const out = path.join(SLIDES, slideName(f, i + 1));
    if (fs.existsSync(out)) return;
    const propsFile = path.join(OUT, 'slide-props.json');
    writeJson(propsFile, {scene: {at: '', ...scene}, index: i + 1, total: item.slides.length, tag: item.tag});
    execFileSync(
      'npx',
      ['remotion', 'still', 'src/index.ts', 'Slide', out, `--props=${propsFile}`, '--frame=120', '--image-format=jpeg', '--jpeg-quality=92', ...browser],
      {cwd: VIDEO_DIR, stdio: 'inherit'},
    );
    made++;
  });
}

// Drop slides whose carousel went out more than 2 days ago, then stage everything that's left for hosting.
for (const f of fs.readdirSync(SLIDES)) {
  const posted = path.join(TT_POSTED, f.replace(/-\d+\.jpeg$/, '.json'));
  if (fs.existsSync(posted)) {
    const at = readJson(posted).scheduledFor;
    if (at && Date.now() - new Date(at).getTime() > 2 * 24 * 3600 * 1000) fs.rmSync(path.join(SLIDES, f));
  }
}
const slides = fs.readdirSync(SLIDES).filter((f) => f.endsWith('.jpeg'));
if (slides.length) {
  fs.mkdirSync(path.join(SITE, 'slides'), {recursive: true});
  if (!fs.existsSync(path.join(SITE, 'index.html')))
    fs.writeFileSync(path.join(SITE, 'index.html'), '<!doctype html><title>localhost media</title><p>media host for @localhost.wear</p>');
  for (const f of slides) fs.copyFileSync(path.join(SLIDES, f), path.join(SITE, 'slides', f));
}
console.log(`Slides: made ${made}, hosting ${slides.length}.`);
setOutput('ready', made > 0 ? 'true' : 'false');
