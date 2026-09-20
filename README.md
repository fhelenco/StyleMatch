# StyleMatch

AI-powered wardrobe app: organize your closet digitally and get outfit
suggestions with a written rationale and a cohesion score.

*Add a short demo video or GIF here — a 15–30s clip of "upload a piece →
generate a look → save to Lookbook" is the fastest way to show what this does.*

## What it does
- **Wardrobe:** photograph or upload clothing pieces; Claude analyzes each
  photo to auto-tag category, color, fabric, pattern and season. Browse and
  filter by category, season and style.
- **AI outfits:** generate a look — from scratch, around a chosen occasion, or
  built around one base piece — with a cohesion score and a written
  explanation of why the pieces work together. Swap out a single piece and
  the AI picks a replacement that still fits the rest of the look.
- **Lookbook:** save, favorite, and filter generated looks (by occasion,
  season, etc.).
- **Weather-aware suggestions:** set a home city and the Home screen surfaces
  today's temperature with a one-tap "see a look for today," pre-matched to
  the season.
- **Aesthetic DNA:** a small radar-chart summary of your wardrobe's style
  leanings (minimal vs. avant-garde, structured vs. fluid, etc.), shareable
  as a saved image.

## Screenshots
*Add a few screenshots here — Wardrobe grid, an outfit result with its
cohesion score, and the Lookbook are the most representative.*

## Design decisions
- **Explain the AI's choices.** Every outfit includes a short written
  rationale and role labels per piece (Foundation, Base, Layer, Accent) so
  the reasoning is visible, not just the result.
- **Cohesion score.** Not a fixed formula — Claude scores each outfit 0–100
  against explicit color, fabric, proportion, and style-coherence rules
  baked into the prompt (e.g. 90+ is a flawless pairing, below 60 is
  forced/clashing), and is instructed to vary scores across suggestions
  rather than default to a safe middle number.
- **Editorial visual language.** Serif headings, a muted neutral palette, and
  generous whitespace so the wardrobe reads like a curated collection rather
  than a utility app. Full light/dark theming throughout.

## Stack
- **Mobile:** Expo (React Native) + Expo Router, TypeScript, Zustand +
  TanStack Query for state, `expo-camera` / `expo-image-picker` for capture
- **Backend:** Node.js + Express + TypeScript
- **Database / Auth / Storage:** Supabase (Postgres, Auth, Storage)
- **AI:** Anthropic Claude API (currently Sonnet 4.6) for garment analysis
  and outfit generation — all model calls live in one file,
  [`backend/src/services/claudeService.ts`](backend/src/services/claudeService.ts)
- **Image processing:** `@imgly/background-removal-node` + `sharp`, to lift
  each garment photo onto a clean off-white backdrop before storage
- Built with [Claude Code](https://claude.com/claude-code)

## Run locally

**Prerequisites:** Node 20+, a [Supabase](https://supabase.com) project, an
[Anthropic API key](https://console.anthropic.com), and Expo Go on your phone
(or a web browser) to run the client.

1. Clone the repo
2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
   npm run dev             # listens on :3001
   ```
3. **Mobile**
   ```bash
   cd apps/mobile
   npm install
   cp .env.example .env   # fill in Supabase URL/anon key + EXPO_PUBLIC_API_URL
   npx expo start
   ```
   Press `w` for the web preview, or scan the QR code with Expo Go on your
   phone (same Wi-Fi network as your computer; `EXPO_PUBLIC_API_URL` must be
   your computer's LAN IP, not `localhost`, for a physical device to reach it).
4. **Database schema** — not yet included as SQL migrations in this repo (see
   Known limitations below). In the meantime, recreate the tables referenced
   in `backend/src/routes/*.ts` (`profiles`, `clothing_items`, `outfits`,
   `outfit_items`) in your own Supabase project, matching the columns those
   routes read/write.

## Known limitations / next steps
- **No SQL migrations in the repo yet** — the schema currently only exists
  live in Supabase. Exporting it as versioned migrations is the top item to
  fix before this is easy for someone else to clone and run.
- **Outfit generation latency** — a single AI call typically takes a few
  seconds; there's no progress/streaming feedback beyond a loading spinner.
- **No automated tests or CI** — everything so far has been verified manually
  end-to-end (direct API calls + in-app checks).
- **Trip packing lists** and **"complete the look" gap analysis** (AI
  suggests what to buy to unlock more outfit combinations) are two ideas
  that came up but weren't built — deliberately held back pending a rethink
  of how many floating action buttons the app should have.

## License
[MIT](LICENSE) — see the LICENSE file.
