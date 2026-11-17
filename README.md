# localhost content machine

Every day at 18:00 UTC a GitHub Action:
1. takes the oldest reel script in `content/queue/`
2. makes the voiceover (ElevenLabs) and renders the reel (Remotion, "Lit Terminal" look)
3. hosts the mp4 on GitHub Pages
4. schedules it in Buffer → Instagram Reel + YouTube Short (21:00 UTC), and the next X post (23:30 UTC)
5. moves the files to `posted/` and writes a line in **`status/log.md`** (check this to see if things posted)

New scripts get added weekly by a Claude scheduled task, following `CONTENT_GUIDE.md`.

Secrets needed (Settings → Secrets → Actions): `BUFFER_API_KEY`, `ELEVENLABS_API_KEY`.
Voice and posting times: `config.json`.
Test the look without using voice credits: `cd video && npm ci && npm run make:dry`.
