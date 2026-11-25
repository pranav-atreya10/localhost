// Validates every queued reel and X post. Exit code 1 if anything is wrong.
import path from 'node:path';
import {QUEUE, POSTED, X_QUEUE, TT_QUEUE, TT_POSTED, listJson, readJson, validateReel, validateX, validateTT} from './lib.mjs';

const postedIds = listJson(POSTED).map((f) => readJson(path.join(POSTED, f)).id);
const ids = new Set();
let bad = 0;
for (const f of listJson(QUEUE)) {
  const s = readJson(path.join(QUEUE, f));
  const errs = validateReel(s, postedIds);
  if (ids.has(s.id)) errs.push(`duplicate id ${s.id}`);
  ids.add(s.id);
  console.log(errs.length ? `❌ ${f}\n   - ${errs.join('\n   - ')}` : `✅ ${f}`);
  bad += errs.length;
}
for (const f of listJson(X_QUEUE)) {
  const errs = validateX(readJson(path.join(X_QUEUE, f)));
  const card = readJson(path.join(X_QUEUE, f)).card;
  if (card && !['hook', 'statement', 'code', 'list', 'flow', 'pair', 'compare'].includes(card.type)) errs.push(`card type "${card.type}" not allowed`);
  console.log(errs.length ? `❌ ${f}: ${errs.join(', ')}` : `✅ ${f}`);
  bad += errs.length;
}
const ttPosted = listJson(TT_POSTED).map((f) => readJson(path.join(TT_POSTED, f)).id);
for (const f of listJson(TT_QUEUE)) {
  const t = readJson(path.join(TT_QUEUE, f));
  const errs = validateTT(t, ttPosted);
  if (ids.has(t.id)) errs.push(`duplicate id ${t.id}`);
  ids.add(t.id);
  console.log(errs.length ? `❌ ${f}: ${errs.join(', ')}` : `✅ ${f}`);
  bad += errs.length;
}
process.exit(bad ? 1 : 0);
