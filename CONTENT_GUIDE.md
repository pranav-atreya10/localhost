# Content guide (read this before writing new posts)

This repo runs the **localhost** (@localhost.wear) content machine. A GitHub Action runs **twice a day** (18:00 and 22:30 UTC):
each run takes the **oldest** file in `content/queue/`, makes the voiceover (ElevenLabs), renders the reel (Remotion),
hosts it on GitHub Pages, and schedules it in Buffer for Instagram (Reel) + YouTube (Short). The 18:00 UTC run also schedules the
oldest file in `content/x-queue/` as a text post on X (one X post per day). Posted files move to `content/posted/` and `content/x-posted/`.
`status/log.md` records every run.

## Brand
- Audience: teens and college kids who code, vibe-code, do hackathons.
- Voice: short, dry, a little funny, like a friend who codes at 2am. Lowercase is fine on X.
- Goal right now: **following and presence**. No selling, no "link in bio", no shirt plugs, no discounts, no links.
- Never name or depict real company logos. Naming tools in words is fine.
- Every technical fact must be correct. Use `example.com` and IPs from `203.0.113.0/24` for examples, labeled as examples.
- Security topics: explain defenses only, never attack how-tos.

## Reel file: `content/queue/YYYY-MM-DD-<a|b>-<id>.json`
File names sort = posting order. **Two reels per day**: `-a-` posts 3:30pm ET, `-b-` posts 8pm ET.
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
`{"text": "≤ 280 chars, no links, no hashtags spam"}`. One per day.
Weekly mix (7 posts): 3 one-liner coding jokes, 2 build-in-public posts (true facts only, no made-up numbers),
1 mini-explainer tied to that week's reels, 1 question that invites replies.
