// Pulls Buffer metrics for everything we've posted and writes status/performance.md (+ .json).
// The weekly Claude task reads this to decide what to make more (and less) of.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, POSTED, X_POSTED, listJson, readJson, writeJson} from './lib.mjs';

const KEY = process.env.BUFFER_API_KEY;
if (!KEY) throw new Error('BUFFER_API_KEY is not set');
const gql = async (query, variables = {}) => {
  const res = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) throw new Error(`Buffer API ${res.status}: ${JSON.stringify(body.errors || body).slice(0, 400)}`);
  return body.data;
};

const orgs = (await gql(`query { account { organizations { id } } }`)).account.organizations;
const sent = [];
for (const org of orgs) {
  const chans = (await gql(`query($id: OrganizationId!) { channels(input: {organizationId: $id}) { id service } }`, {id: org.id})).channels;
  for (const ch of chans.filter((c) => ['instagram', 'youtube', 'twitter'].includes(c.service))) {
    let after = null;
    for (let page = 0; page < 3; page++) {
      const d = await gql(
        `query($org: OrganizationId!, $ch: ChannelId!, $after: String) {
          posts(first: 100, after: $after, input: {organizationId: $org, filter: {channelIds: [$ch], status: [sent]}}) {
            edges { node { id text sentAt metrics { type value } } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        {org: org.id, ch: ch.id, after},
      );
      for (const e of d.posts.edges || []) sent.push({...e.node, service: ch.service});
      if (!d.posts.pageInfo?.hasNextPage) break;
      after = d.posts.pageInfo.endCursor;
    }
  }
}

const m = (p, t) => p.metrics?.find((x) => x.type === t)?.value || 0;
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const ageH = (p) => (Date.now() - new Date(p.sentAt).getTime()) / 3600000;

// ---------- reels: Instagram + YouTube combined ----------
const reels = listJson(POSTED)
  .map((f) => readJson(path.join(POSTED, f)))
  .map((s) => {
    // Match by the Buffer post IDs saved at publish time; fall back to caption text (older posts have no IDs).
    const ids = Object.values(s.bufferIds || {});
    const cap = norm(s.captions.instagram);
    const first = norm(s.captions.instagram.split('\n')[0]);
    let posts = sent.filter((p) => p.service !== 'twitter' && ids.includes(p.id));
    if (!posts.length) posts = sent.filter((p) => p.service !== 'twitter' && norm(p.text) === cap);
    if (!posts.length) posts = sent.filter((p) => p.service !== 'twitter' && first && norm(p.text).startsWith(first));
    if (!posts.length) return null;
    const sum = (t) => posts.reduce((a, p) => a + m(p, t), 0);
    const views = Math.max(sum('views'), sum('reach'), sum('impressions'));
    const likes = sum('likes') + sum('reactions');
    const r = {
      id: s.id,
      series: s.seriesBadge,
      hook: s.scenes?.[0]?.text,
      sceneTypes: (s.scenes || []).map((x) => x.type).join(' > '),
      sentAt: posts.map((p) => p.sentAt).sort()[0],
      hoursLive: Math.round(Math.min(...posts.map(ageH))),
      views,
      likes,
      comments: sum('comments'),
      shares: sum('shares') + sum('reposts'),
      saves: sum('saves'),
      follows: sum('follows'),
      byPlatform: Object.fromEntries(posts.map((p) => [p.service, Object.fromEntries((p.metrics || []).map((x) => [x.type, x.value]))])),
    };
    r.engagement = r.likes + 2 * r.comments + 3 * r.shares + 3 * r.saves + 4 * r.follows;
    r.engagementRate = r.views ? r.engagement / r.views : 0;
    return r;
  })
  .filter(Boolean);

// ---------- X ----------
const xs = listJson(X_POSTED)
  .filter((f) => !f.startsWith('FAILED'))
  .map((f) => readJson(path.join(X_POSTED, f)))
  .map((x) => {
    const p =
      sent.find((s) => s.service === 'twitter' && x.bufferId && s.id === x.bufferId) ||
      sent.find((s) => s.service === 'twitter' && norm(s.text) === norm(x.text));
    if (!p) return null;
    const views = Math.max(m(p, 'impressions'), m(p, 'views'), m(p, 'reach'));
    const r = {
      text: x.text,
      sentAt: p.sentAt,
      hoursLive: Math.round(ageH(p)),
      views,
      likes: m(p, 'likes') + m(p, 'reactions'),
      replies: m(p, 'comments'),
      reposts: m(p, 'reposts') + m(p, 'shares') + m(p, 'quotes'),
      follows: m(p, 'follows'),
    };
    r.engagement = r.likes + 2 * r.replies + 3 * r.reposts + 4 * r.follows;
    r.engagementRate = r.views ? r.engagement / r.views : 0;
    return r;
  })
  .filter(Boolean);

// Posts need 48h to settle. On Saturday (the weekly review day) the newest posts count once they've had 24h,
// so the end of the week isn't left out.
const REVIEW_DAY = new Date().getUTCDay() === 6;
const MIN_HOURS = 48;
const MIN_HOURS_REVIEW = 24;
// Score = 70% engagement (rate) + 30% reach (views), each ranked 0–1 among the posts that qualify.
const score = (list) => {
  const ready = list.filter((r) => r.hoursLive >= (REVIEW_DAY ? MIN_HOURS_REVIEW : MIN_HOURS));
  for (const r of ready) r.early = r.hoursLive < MIN_HOURS;
  const rank = (key) => {
    const sorted = [...ready].sort((a, b) => a[key] - b[key]);
    return (r) => (ready.length > 1 ? sorted.indexOf(r) / (ready.length - 1) : 0.5);
  };
  const er = rank('engagementRate');
  const v = rank('views');
  for (const r of ready) r.score = Math.round((0.7 * er(r) + 0.3 * v(r)) * 100);
  return ready.sort((a, b) => b.score - a.score);
};
const rankedReels = score(reels);
const rankedX = score(xs);

const pct = (x) => (x * 100).toFixed(1) + '%';
let md = `# Performance (auto-updated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)\n\n`;
md += `Score = 70% engagement rate + 30% views, ranked against each other (100 = best). Posts are scored after 48h live; on Saturdays (review day) the newest ones count after 24h (marked *).\n`;
md += `Engagement = likes + 2×comments + 3×shares + 3×saves + 4×follows. Small numbers early on = noisy, treat as hints.\n\n`;
md += `## Reels (Instagram + YouTube combined)\n\n| score | id | series | hook | views | likes | comments | shares | saves | follows | eng. rate |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rankedReels) md += `| ${r.score}${r.early ? '*' : ''} | ${r.id} | ${r.series} | ${r.hook} | ${r.views} | ${r.likes} | ${r.comments} | ${r.shares} | ${r.saves} | ${r.follows} | ${pct(r.engagementRate)} |\n`;
if (!rankedReels.length) md += `| – | no reels old enough to score yet | | | | | | | | | |\n`;
md += `\n## X posts\n\n| score | post | views | likes | replies | reposts | eng. rate |\n|---|---|---|---|---|---|---|\n`;
for (const r of rankedX) md += `| ${r.score}${r.early ? '*' : ''} | ${r.text.replace(/\n+/g, ' / ').slice(0, 90)} | ${r.views} | ${r.likes} | ${r.replies} | ${r.reposts} | ${pct(r.engagementRate)} |\n`;
if (!rankedX.length) md += `| – | no X posts old enough to score yet | | | | | |\n`;

fs.mkdirSync(path.join(ROOT, 'status'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'status', 'performance.md'), md);
writeJson(path.join(ROOT, 'status', 'performance.json'), {updatedAt: new Date().toISOString(), reels: rankedReels, x: rankedX, unscored: {reels: reels.length - rankedReels.length, x: xs.length - rankedX.length}, unmatched: {reels: listJson(POSTED).length - reels.length, x: listJson(X_POSTED).length - xs.length}});
console.log(`Stats: ${rankedReels.length} reels and ${rankedX.length} X posts scored; ${listJson(POSTED).length - reels.length} reels and ${listJson(X_POSTED).length - xs.length} X posts not found in Buffer.`);
