# Content guide (read this before writing new posts)

This repo runs the **localhost** (@localhost.wear) content machine. A GitHub Action runs **twice a day** (18:00 and 22:30 UTC):
each run takes the **oldest** file in `content/queue/`, makes the voiceover (ElevenLabs), renders the reel (Remotion),
hosts it on GitHub Pages, and schedules it in Buffer for Instagram (Reel) + YouTube (Short). The runs also schedule the oldest files in
`content/x-queue/` as text posts on X: **3 X posts per day** (6:15am, 6pm, 9:30pm ET). Posted files move to `content/posted/` and `content/x-posted/`.
`status/log.md` records every run. `status/performance.md` ranks what's been posted (from Buffer stats, refreshed every run).

## Brand
- Audience: teens and college kids who code, vibe-code, do hackathons.
- Voice: short, dry, a little funny, like a friend who codes at 2am. Lowercase is fine on X.
- Goal right now: **following and presence**. No selling, no "link in bio", no shirt plugs, no discounts, no links.
- Never name or depict real company logos. Naming tools in words is fine.
- Every technical fact must be correct. Use `example.com` and IPs from `203.0.113.0/24` for examples, labeled as examples.
- Security topics: explain defenses only, never attack how-tos.

## Reel file: `content/queue/YYYY-MM-DD-<a|b>-<id>.json`
File names sort = posting order. **Two reels per day**: `-a-` posts 4:30pm ET, `-b-` posts 8pm ET.
Run **two series in parallel**: series 1 always takes the `a` slot, series 2 always takes the `b` slot
(e.g. 2026-11-24-a-… = series 1 part 1, 2026-11-24-b-… = series 2 part 1). Keep at least 14 reels queued.

```json
{
  "id": "short-unique-id",
  "seriesBadge": "series_name · 1/3",
  "voiceover": "85–115 words (30–45 s). Hook in the first sentence. Ends with 'Part two: …' or 'Send this to …'.",
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
- `{"type":"end","at":"…","text":"part 2: …","sub":"optional"}`

Check before committing: `cd video && npm ci && node pipeline/check.mjs` (validates every queued file).

## X file: `content/x-queue/YYYY-MM-DD-xN.json`
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
