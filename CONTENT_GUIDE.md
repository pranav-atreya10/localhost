# Content guide (read this before writing new posts)

This repo runs the **localhost** (@localhost.wear) content machine. A GitHub Action runs **once a day** (12:00 UTC, backup 15:00 UTC)
and schedules the next ~24 hours. For each reel slot it takes the oldest matching file in `content/queue/`, makes the voiceover (ElevenLabs), renders the reel (Remotion),
hosts it on GitHub Pages, and schedules it in Buffer for Instagram (Reel) + YouTube (Short). The runs also schedule the oldest files in
`content/x-queue/` as text posts on X: **3 X posts per day** (6:15am, 6pm, 9:30pm ET). Posted files move to `content/posted/` and `content/x-posted/`.
`status/log.md` records every run. `status/performance.md` ranks what's been posted (from Buffer stats, refreshed every run).

## Brand
- Audience: teens and college kids who code, vibe-code, do hackathons.
- Voice: short, dry, a little funny, like a friend who codes at 2am. Lowercase is fine on X.
- Goal right now: **views that lead to store visits** (localhostwear.xyz). The reels do the warming up; the profile does the selling.
- Allowed: showing the shirt at the end of a joke reel. Not allowed: hard selling, "buy now" / "shop now", discounts or codes, prices in the voiceover, links anywhere (captions, voiceover, X), "link in bio".
- Never name or depict real company logos. Naming tools in words is fine.
- Every technical fact must be correct. Use `example.com` and IPs from `203.0.113.0/24` for examples, labeled as examples.
- Security topics: explain defenses only, never attack how-tos.

## What we sell (only ever show these)
The store sells exactly two products. Never show or mention anything else.
- **terminal tee**: $25 → scene `"item": "tee"`
- **terminal hoodie**: $47 → scene `"item": "hoodie"`
Front (chest): terminal-style `> localhost█`, green prompt and cursor, logo only, no joke text.
Back print: the joke, e.g. white "there's no place like" + green "127.0.0.1" + small "// localhost". Only the jokes the store really prints may be shown on a back: **"there's no place like 127.0.0.1"** (confirmed on the hoodie back). "works on my machine" and "shipped it at 3am" are brand jokes but their back layouts aren't confirmed, so don't use `joke` for them until the exact print is added here.
Never put prices in the voiceover or captions. No real company logos, no AI images of people wearing the shirts.

## Reel mix: "the joke is the shirt"
Per week (14 reels): **about 10 joke → shirt reels and 4 lesson reels**. Keep series 1 in the `a` slot and series 2 in the `b` slot only for lessons; joke reels can go in either slot. Spread lessons out, don't stack them.
- **Joke → shirt reel** (20–35 s, 55–85 words): one relatable coding pain (pushing to main, deploying on Friday, "works on my machine", 3am commits, final_final_v2 files, merge conflicts, "port already in use"). Dry and funny, with a real tip or fact inside it so it's correct and worth saving. Ends on the matching shirt: the last scene is a `shirt` scene. The last voiceover sentence is "Send this to …" (whoever lives this pain). Never a sales pitch.
  - Set `"seriesBadge": "dev_pain · #N"` and don't say "Part 1/3".
  - Open with the same story hook as always: a short "you" moment (see Hooks below).
  - Scene shape: `hook` → 1–2 explainer scenes (compare, code, list, flow, statement) → `shirt`.
  - Captions: keyword-first line, one dry line, ≤ 5 hashtags, no store name, no link.
- **Lesson reel**: the old format (security-with-stakes topics like b2-salting do best: something at stake, a compare scene early, 85–115 words). It can end on `end` or `shirt`. Make lessons stand-alone or a complete series. Never queue a part 2 without its part 1.

## Reel file: `content/queue/YYYY-MM-DD-<a|b>-<id>.json`
File names sort = posting order. **Two reels per day**: `-a-` posts 4:30pm ET, `-b-` posts 8pm ET.
Run **two series in parallel**: series 1 always takes the `a` slot, series 2 always takes the `b` slot
(e.g. 2026-11-24-a-… = series 1 part 1, 2026-11-24-b-… = series 2 part 1). Keep at least 14 reels queued.

```json
{
  "id": "short-unique-id",
  "seriesBadge": "series_name · 1/3",
  "voiceover": "joke reels: 55–85 words (20–35 s); lesson reels: 85–115 words. Hook in the first sentence. Ends with 'Send this to …' (lessons in a series: 'Part two: …').",
  "scenes": [ ...4–7 scenes, first is always type "hook"... ],
  "keywords": ["words", "to", "underline", "green", "in", "captions"],
  "captions": {
    "instagram": "keyword-first line\nsecond line. Part 1/3 of \"series.\"\n#tag #tag #tag (max 5)",
    "youtubeTitle": "≤ 60 chars, 1–2 hashtags"
  }
}
```

Every scene except the first has `"at"`: the exact words from the voiceover where that scene starts
(same order as the voiceover; punctuation and capitals don't matter; avoid hyphenated words in `at`).

Scene types (all text must be short; the card is ~730 px wide):
- `{"type":"hook","text":"≤ 6 words","sub":"optional small mono line"}`
- `{"type":"statement","at":"…","big":"one big line","small":"optional mono line in a glass card","chips":["optional","pills"]}`
- `{"type":"code","at":"…","title":"window title","lines":["≤ 34 chars each", "// comments go gray", "✓ green / ✗ red"],"highlight":1,"note":"optional"}`
- `{"type":"list","at":"…","title":"…","items":[{"text":"…","status":"ok|bad|none"}]}` (2–4 items)
- `{"type":"flow","at":"…","title":"…","nodes":["a","b","c"]}` (3–5 nodes, vertical chain with a traveling dot)
- `{"type":"pair","at":"…","left":"you","right":"server","messages":[{"dir":"right","label":"SYN"},{"dir":"left","label":"SYN-ACK"}],"result":"optional pill"}` (2–4 messages)
- `{"type":"compare","at":"…","left":{"label":"…","value":"…"},"right":{"label":"…","value":"…"},"verdict":"…","verdictTone":"ok|bad"}`
- `{"type":"shirt","at":"…","item":"tee|hoodie","joke":"optional white back text (use \n for line breaks)","accent":"optional green back text","line":"optional wordmark under the shirt (default: localhost)"}`
  **Last scene only.** Draws a black tee or hoodie (SVG). It shows the front first (`> localhost` logo on the chest, small `> localhost` line under it). If `joke`/`accent` are set it flips to the back print after ~1.5 s. `at` = the words where the shirt appears (usually the punchline). Only set `joke`/`accent` for back prints listed in "What we sell"; otherwise leave them out and the scene stays on the front. Example (confirmed): `"joke":"there's no\nplace like","accent":"127.0.0.1"` on a hoodie.
- `{"type":"end","at":"…","text":"part 2: …","sub":"optional"}`

Check before committing: `cd video && npm ci && node pipeline/check.mjs` (validates every queued file).

## X file: `content/x-queue/YYYY-MM-DD-xN.json`
Optional image card in the reel look (rendered automatically, 1080×1080): add `"card": {…}` using any reel scene type
except `end` and `shirt` (no `"at"` needed), e.g. `"card": {"type":"list","title":"before you install","items":[{"text":"does it exist?","status":"ok"}]}`.
Give a card to **about 1 in 3 X posts**: always the mini-explainers, sometimes a joke that works visually (code/compare).
Keep card text even shorter than in reels.

`{"text": "≤ 280 chars, no links, no hashtag spam"}`. **Three per day; keep at least 21 queued.**
Name files `YYYY-MM-DD-xN.json` so they sort in posting order.
Weekly mix (21 posts): 8 one-liner coding jokes/observations, 4 build-in-public posts (true facts only, no
made-up numbers), 4 mini-explainers tied to that week's reels, 3 questions that invite replies, 2 "hot takes"
about coding/AI (light, never mean). Morning posts (the 6:15am one) work best as quick jokes or questions.

## Learning from performance
Before writing new content, read `status/performance.md` (and `status/performance.json` for per-platform numbers).
- Score = 70% engagement rate + 30% views. Posts are scored after 48h; on Saturday the newest count after 24h (marked * — treat as less certain). Engagement counts comments, shares, saves and follows more than likes.
- Make **more** of what the top-scoring posts share: topic area, hook style (question? surprising claim?), scene
  types, voiceover structure, length, X post format. Make **less** of what the bottom ones share.
- Replicate the *pattern*, never repeat the same topic or joke.
- With fewer than ~6 scored posts, the numbers are mostly noise: keep variety and only lean a little.
- In the commit message, write one line on what you leaned into and why (e.g. "more 'myth vs fact' hooks: top 2 reels").

## Hooks: open on a story (standing rule)
- Every reel opens on a short "you" scene the viewer has lived: 2am commit, 50 tabs freezing, a push at midnight. Then the explainer.
- Use second person ("you…"), never made-up first-person events about the brand.
- Hook card ≤ 6 words, understandable with the sound off. No vague metaphors ("your browser shakes hands first" kept people only 4.5 s).
- The first voiceover sentence sets up a problem or surprise; the payoff comes within ~10 seconds.

## What the numbers say so far (update as data grows)
- **Switch (2026-11-23):** reels moved from tech lessons to joke → shirt reels, because the first week of lessons got only 117–271 views per reel and zero follows. Judge the new format on views, shares, saves, profile visits and store visits (Shopify analytics), and compare against these lesson numbers. Keep what the top joke reels share (pain, hook, scene types) and drop what the bottom ones share.
- Average Instagram watch time is the clearest early signal: b2-salting 13.9 s (best), b1-hashing 8.2 s, a2-handshake 4.5 s (worst). Most viewers leave during the hook.
- Winners: security topics where the viewer has something at stake (their password), with a concrete side-by-side (compare scene) in the first 5 seconds.
- Losers: abstract "how the internet works" steps with no personal stakes.
- YouTube Shorts shows ~0 views on every reel so far: don't judge content by YouTube numbers yet.

## TikTok carousel file: `content/tt-queue/YYYY-MM-DD-tN.json`
**One photo carousel a day at 6:30pm ET**, posted to TikTok through Buffer. Carousels only post once a TikTok channel is
connected in Buffer; until then they wait in the queue (nothing fails). Keep at least 7 queued.
Slides are rendered as 1080×1920 JPEGs (TikTok rejects PNG) by `pipeline/slides.mjs`, kept in `media/slides/` and hosted on GitHub Pages.

```json
{
  "id": "short-unique-id",
  "tag": "dev pain",            // shown in the slide counter pill: "dev pain · 1/5"
  "format": "transformation",   // transformation | listicle | tutorial (notes only)
  "caption": "keyword-first line. one question. max 5 hashtags, no links",
  "slides": [ {"type":"hook",...}, ..., {"type":"shirt","item":"tee","line":"localhostwear.xyz"} ]
}
```

- 4–7 slides. Slide 1 is always a `hook`. Allowed types: hook, statement, code, list, flow, compare, shirt (same fields as reel scenes, no `"at"`).
- Last slide = `shirt` with **front only** (no `joke`/`accent`): the real product is the front logo, so never show a back print that doesn't exist.
- What wins on TikTok slideshows (Virlo scan of 117 viral slideshows, Nov 2026): **transformation / before-after** by far, then **tutorials** and **listicles**. Reviews and storytime flop. 2 slides or ~10 slides were the most common winning counts; 9 rarely worked.
- Mix per week: 3 transformations (day 1 vs day 100, junior vs senior, 9pm vs 3am), 2 listicles ("5 signs you're…"), 2 tutorials (60-second lesson, like b2-salting).
- Captions: TikTok drops line breaks, so write one flowing line. Don't write "#4" in text (it counts as a hashtag).
- Preview locally: `REMOTION_BROWSER=/path/to/chrome node pipeline/slides.mjs --all`.
