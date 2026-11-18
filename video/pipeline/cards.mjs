// Renders image cards for the X posts this run will schedule (only posts that have a "card"),
// saves them in media/cards/ (kept in git so they stay hosted until they post), and stages all cards in site/.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {VIDEO_DIR, X_QUEUE, X_POSTED, OUT, SITE, CARDS, listJson, readJson, writeJson, openXSlots, cardName} from './lib.mjs';

const setOutput = (k, v) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
};
const all = process.argv.includes('--all'); // render every queued card (for previews)

fs.mkdirSync(CARDS, {recursive: true});
fs.mkdirSync(OUT, {recursive: true});
const upcoming = listJson(X_QUEUE).slice(0, all ? undefined : openXSlots().length);
const browser = process.env.REMOTION_BROWSER ? ['--browser-executable', process.env.REMOTION_BROWSER] : [];
let made = 0;
for (const f of upcoming) {
  const item = readJson(path.join(X_QUEUE, f));
  if (!item.card) continue;
  const out = path.join(CARDS, cardName(f));
  if (fs.existsSync(out)) continue;
  const propsFile = path.join(OUT, 'card-props.json');
  writeJson(propsFile, {scene: {at: '', ...item.card}});
  execFileSync('npx', ['remotion', 'still', 'src/index.ts', 'Card', out, `--props=${propsFile}`, '--frame=140', '--image-format=png', ...browser], {
    cwd: VIDEO_DIR,
    stdio: 'inherit',
  });
  made++;
}

// Drop cards whose post went out more than 2 days ago, then stage everything that's left for hosting.
for (const f of fs.readdirSync(CARDS)) {
  const posted = path.join(X_POSTED, f.replace(/\.png$/, '.json'));
  if (fs.existsSync(posted)) {
    const at = readJson(posted).scheduledFor;
    if (at && Date.now() - new Date(at).getTime() > 2 * 24 * 3600 * 1000) fs.rmSync(path.join(CARDS, f));
  }
}
const cards = fs.readdirSync(CARDS).filter((f) => f.endsWith('.png'));
if (cards.length) {
  fs.mkdirSync(path.join(SITE, 'cards'), {recursive: true});
  if (!fs.existsSync(path.join(SITE, 'index.html')))
    fs.writeFileSync(path.join(SITE, 'index.html'), '<!doctype html><title>localhost media</title><p>media host for @localhost.wear</p>');
  for (const f of cards) fs.copyFileSync(path.join(CARDS, f), path.join(SITE, 'cards', f));
}
console.log(`Cards: made ${made}, hosting ${cards.length}.`);
setOutput('ready', made > 0 ? 'true' : 'false');
