# Hyperframes Composition Brief: Waynora

## Objective

Create a short launch-style brag video for Waynora, a multi-agent AI travel advisor. The video should feel like a premium product film — confident, elegant, and honest about what the product does.

## Output

- Composition directory: `docs/demo-video/composition/`
- Rendered video: `docs/demo-video/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material

- Project root: `C:\Users\yadav_alldafn\OneDrive\New folder\Documents\01_projects\Gen ai project\Working\Waynora`
- Primary files read: `frontend/src/routes/Landing.tsx`, `frontend/src/routes/Chat.tsx`, `frontend/src/components/chat/WaitingShell.tsx`, `frontend/src/components/game/Game2048.tsx`, `frontend/src/styles/tokens.css`, `PRODUCT.md`, `frontend/prompt.md`
- Product name: Waynora
- Tagline / strongest claim: "Deep-research travel intelligence with total transparency"
- Key UI or visual moment to recreate: The waiting shell with 2048 game, and the chat interface with travel request submission
- Copy that must appear verbatim:
  - "Waynora" (brand name)
  - "AI trip planning — tell us where you want to go" (landing headline)
  - "Deep-research travel intelligence with total transparency" (tagline)

## Creative Direction

- Tone preset: polished
- Creative direction: quiet premium product film
- Interpretation: Confidence through restraint. Slow, elegant transitions. Let the product speak. No flashy gimmicks — the luxury aesthetic is the visual identity.
- Angle: The product's own honesty is the hook. Waynora doesn't pretend travel planning is instant. It tells you "5–15 minutes" and means it — and gives you a 2048 game while you wait.
- Hook: The landing page hero with the Waynora wordmark and headline, then a quick cut to the chat interface.
- Outro / punchline: The Waynora logo with the tagline "Deep-research travel intelligence with total transparency."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Fake progress bars or fabricated results

## Visual Identity

- Background: Deep warm dark (near-black with warm undertones, approximately #1a1512 or similar)
- Text: Warm white/cream (approximately #f5f0e8 or similar)
- Accent: Gold/amber (approximately #c9a84c or similar)
- Display font: Serif (editorial, luxury feel — similar to Playfair Display or Cormorant)
- Body font: Clean sans-serif (similar to Inter or system fonts)
- Visual references from the project:
  - Landing page hero with warm dark background and gold accents
  - Chat interface with clean message bubbles
  - Waiting shell with elapsed time and 2048 game
  - Luxury travel editorial aesthetic

## Storyboard

Use the storyboard in `docs/demo-video/brag-plan.md` as the creative contract.

Scene summary:
1. Landing Page Hero — 4s — Waynora wordmark and headline visible, luxury aesthetic
2. Sign In — 3s — User enters credentials and signs in
3. Chat Interface + Waiting — 6s — User types travel request, submits, waiting shell with 2048 appears
4. Itinerary Result — 5s — Comprehensive travel plan appears in Markdown
5. Logo Outro — 2s — Waynora logo with tagline

## Audio

- Audio role: warm bed
- Audio arc: Warm, confident bed that builds gently through the user journey, swells at the itinerary reveal, and fades under the final logo
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean, best for polished tone)
- Music treatment: Start at 0.35 volume, duck to 0.15 under final logo, fade out at end
- Music cue guidance: Bundled preset at `C:\Users\yadav_alldafn\.config\opencode\skills\brag\assets\music\cues\happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Key strong cues: 8.74s (0.99), 13.11s (0.98), 17.47s (0.99), 22.93s (1.00). Use 1-3 strong cue locks for major moments.
- Audio-reactive treatment: subtle; use music RMS to make the hero glow and product card presence breathe. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 2 (Sign In) — subtle key ticks as text is typed
  - Scene 3 (Chat + Waiting) — typing sounds for the request, soft click on send, 2048 tile sounds
  - Scene 4 (Itinerary) — soft arrival cue as the itinerary appears
- SFX selection guidance: polished tone — 2-3 very subtle SFX. Use `interface/bong_001` for a soft accent, `interface/drop_001` for a gentle reveal, `keyboard/keypress-*` for typing. Nothing aggressive.
- SFX analysis guidance: `C:\Users\yadav_alldafn\.config\opencode\skills\brag\assets\sfx\sfx-analysis.md`
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `docs/demo-video/composition/assets/`

## Hyperframes Instructions

Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
- Keep creation and rendering local. Remote or publishing workflows require a separate explicit user request.
