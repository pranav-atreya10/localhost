import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const VIDEO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = path.resolve(VIDEO_DIR, '..');
export const CONTENT = path.join(ROOT, 'content');
export const QUEUE = path.join(CONTENT, 'queue');
export const POSTED = path.join(CONTENT, 'posted');
export const X_QUEUE = path.join(CONTENT, 'x-queue');
export const X_POSTED = path.join(CONTENT, 'x-posted');
export const OUT = path.join(VIDEO_DIR, 'out');
export const SITE = path.join(ROOT, 'site');
export const STATUS = path.join(ROOT, 'status', 'log.md');

export const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

export const listJson = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeJson = (p, v) => {
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
};

export const log = (line) => {
  fs.mkdirSync(path.dirname(STATUS), {recursive: true});
  if (!fs.existsSync(STATUS)) fs.writeFileSync(STATUS, '# Posting log\n\nNewest at the bottom. ✅ = scheduled in Buffer, ❌ = failed.\n\n');
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  fs.appendFileSync(STATUS, `- ${stamp} — ${line}\n`);
  console.log(line);
};

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\.(?=\s|$)/g, '')
    .trim();

// Checks a reel script before we spend any voice credits on it.
export const validateReel = (s, postedIds = []) => {
  const errs = [];
  const need = ['id', 'seriesBadge', 'voiceover', 'scenes', 'keywords', 'captions'];
  for (const k of need) if (!s[k]) errs.push(`missing "${k}"`);
  if (errs.length) return errs;
  const words = s.voiceover.split(/\s+/).filter(Boolean).length;
  if (words < 55 || words > 135) errs.push(`voiceover is ${words} words (want 55–135)`);
  if (/https?:\/\//i.test(s.voiceover + s.captions.instagram)) errs.push('no links allowed');
  if (/link in bio|buy now|shop now|discount/i.test(s.voiceover + s.captions.instagram)) errs.push('no sales CTAs allowed');
  if (!s.captions.instagram || s.captions.instagram.length > 2000) errs.push('instagram caption missing/too long');
  const tags = (s.captions.instagram.match(/#\w+/g) || []).length;
  if (tags > 5) errs.push(`${tags} hashtags (max 5)`);
  if (!s.captions.youtubeTitle || s.captions.youtubeTitle.length > 100) errs.push('youtube title missing/too long');
  if (postedIds.includes(s.id)) errs.push(`id "${s.id}" was already posted`);
  if (!Array.isArray(s.scenes) || s.scenes.length < 3) errs.push('need at least 3 scenes');
  // Every scene's "at" phrase must appear in the voiceover, in order.
  const vo = norm(s.voiceover).split(' ');
  let from = 0;
  s.scenes.forEach((sc, i) => {
    if (i === 0) return;
    const t = norm(sc.at || '').split(' ').filter(Boolean);
    if (!t.length) return errs.push(`scene ${i + 1} has no "at" phrase`);
    let found = -1;
    for (let j = from; j < vo.length; j++) if (t.every((w, k) => vo[j + k] === w)) { found = j; break; }
    if (found < 0) errs.push(`scene ${i + 1} "at" phrase not found (in order): "${sc.at}"`);
    else from = found + 1;
  });
  return errs;
};

export const validateX = (x) => {
  const errs = [];
  if (!x.text) errs.push('missing text');
  else if ([...x.text].length > 280) errs.push(`X post is ${[...x.text].length} chars (max 280)`);
  if (/https?:\/\//i.test(x.text || '')) errs.push('no links in X posts');
  return errs;
};
