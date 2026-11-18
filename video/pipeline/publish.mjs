// Sends today's reel (Instagram Reel + YouTube Short) and today's X post to Buffer.
// Needs env BUFFER_API_KEY. Run after make.mjs and after the video is live on GitHub Pages.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, OUT, POSTED, X_QUEUE, X_POSTED, config, listJson, readJson, writeJson, log, validateX, slot, currentSlot} from './lib.mjs';

const KEY = process.env.BUFFER_API_KEY;
if (!KEY) throw new Error('BUFFER_API_KEY is not set');

let ENDPOINT = 'https://api.buffer.com';
const gql = async (query, variables = {}) => {
  for (const url of [ENDPOINT, 'https://api.buffer.com/graphql']) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({query, variables}),
    });
    if (res.status === 404) continue;
    ENDPOINT = url;
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors) throw new Error(`Buffer API ${res.status}: ${JSON.stringify(body.errors || body).slice(0, 600)}`);
    return body.data;
  }
  throw new Error('Buffer API endpoint not found');
};

const getChannels = async () => {
  const d = await gql(`query { account { organizations { id name } } }`);
  const all = [];
  for (const org of d.account.organizations) {
    const c = await gql(
      `query($id: OrganizationId!) { channels(input: {organizationId: $id}) { id name service isQueuePaused } }`,
      {id: org.id},
    );
    all.push(...c.channels);
  }
  return all;
};

const CREATE = `mutation($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id } }
    ... on MutationError { message }
  }
}`;

const createPost = async (input) => {
  const d = await gql(CREATE, {input});
  const r = d.createPost;
  if (!r?.post?.id) throw new Error(r?.message || 'unknown createPost error');
  return r.post.id;
};
const bufferIds = {};
const track = async (service, input) => {
  bufferIds[service] = await createPost(input);
};

const {name: SLOT_NAME, slot: SLOT} = currentSlot();

const waitForUrl = async (url) => {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(url, {method: 'HEAD'}).catch(() => null);
    if (r?.ok) return;
    await new Promise((res) => setTimeout(res, 15000));
  }
  throw new Error(`Video never went live at ${url}`);
};

const channels = await getChannels();
console.log('Buffer channels:', channels.map((c) => `${c.service}:${c.name}`).join(', '));
const byService = (s) => channels.find((c) => c.service === s);
const failures = [];

// ---------- reel ----------
const planFile = path.join(OUT, 'plan.json');
if (fs.existsSync(planFile)) {
  const plan = readJson(planFile);
  const script = readJson(path.join(ROOT, plan.scriptPath));
  const url = `${config.pagesBase}/${plan.video}`;
  await waitForUrl(url);
  const dueAt = slot(SLOT.hourUTC, SLOT.minuteUTC);
  const video = {video: {url, metadata: {thumbnailOffset: 1200}}};
  const results = [];

  const ig = byService('instagram');
  if (ig) {
    try {
      await track('instagram', {
        channelId: ig.id,
        text: script.captions.instagram,
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt,
        assets: [video],
        metadata: {instagram: {type: 'reel', shouldShareToFeed: true, isAiGenerated: true}},
      });
      results.push('Instagram ✅');
    } catch (e) {
      results.push('Instagram ❌');
      failures.push(`Instagram: ${e.message}`);
    }
  } else failures.push('No Instagram channel connected in Buffer');

  const yt = byService('youtube');
  if (yt) {
    try {
      await track('youtube', {
        channelId: yt.id,
        text: script.captions.youtubeDescription || script.captions.instagram,
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt,
        assets: [video],
        metadata: {
          youtube: {
            title: script.captions.youtubeTitle,
            privacy: config.youtube.privacy,
            categoryId: config.youtube.categoryId,
            madeForKids: false,
            notifySubscribers: true,
            isAiGenerated: true,
          },
        },
      });
      results.push('YouTube ✅');
    } catch (e) {
      results.push('YouTube ❌');
      failures.push(`YouTube: ${e.message}`);
    }
  } else failures.push('No YouTube channel connected in Buffer');

  // Move the script out of the queue as long as at least one platform took it (so nothing double-posts).
  if (results.some((r) => r.includes('✅'))) {
    writeJson(path.join(POSTED, path.basename(plan.scriptPath)), {...script, scheduledFor: dueAt, results, bufferIds});
    fs.rmSync(path.join(ROOT, plan.scriptPath));
  }
  log(`${SLOT_NAME} reel **${script.id}** for ${dueAt.slice(0, 16).replace('T', ' ')} UTC — ${results.join(', ')}`);
}

// ---------- X ----------
const xc = byService('twitter') || byService('x');
const xSlots = SLOT.x || [];
if (xSlots.length && !xc) failures.push('No X channel connected in Buffer');
for (const xs of xc ? xSlots : []) {
  const xq = listJson(X_QUEUE);
  if (!xq.length) {
    failures.push('X queue is empty');
    break;
  }
  const file = xq[0];
  const item = readJson(path.join(X_QUEUE, file));
  const errs = validateX(item);
  if (errs.length) {
    failures.push(`X post ${file}: ${errs.join(', ')}`);
    // park the bad post so it doesn't block the queue
    writeJson(path.join(X_POSTED, 'FAILED-' + file), {...item, errors: errs});
    fs.rmSync(path.join(X_QUEUE, file));
    continue;
  }
  const dueAt = slot(xs.hourUTC, xs.minuteUTC);
  try {
    const bufferId = await createPost({channelId: xc.id, text: item.text, schedulingType: 'automatic', mode: 'customScheduled', dueAt});
    writeJson(path.join(X_POSTED, file), {...item, scheduledFor: dueAt, bufferId});
    fs.rmSync(path.join(X_QUEUE, file));
    log(`X post for ${dueAt.slice(0, 16).replace('T', ' ')} UTC "${item.text.slice(0, 40).replace(/\n/g, ' ')}…" ✅`);
  } catch (e) {
    failures.push(`X: ${e.message}`);
    break;
  }
}

if (failures.length) {
  for (const f of failures) log(`❌ ${f.slice(0, 300)}`);
  process.exitCode = 1;
}
