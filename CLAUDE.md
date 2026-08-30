# StyleMatch — Project Context

Full-stack fashion assistant app. React Native (Expo) mobile client + Node/Express backend + Supabase (DB, auth, storage).

## Repo layout
```
apps/mobile/    Expo Router app (React Native)
backend/        Express API + Claude/Anthropic integration
```

## AI model configuration

**All Claude API calls live in one file:** [`backend/src/services/claudeService.ts`](backend/src/services/claudeService.ts).

There are two call sites, and **both currently use the same model**:

| Function | Purpose | Model |
|---|---|---|
| `analyzeGarment()` | Vision call — photo → label, category, tags, fabric care, colors, brand, collection | `claude-haiku-4-5-20251001` |
| `generateOutfitSuggestions()` | Text call — anchor item + wardrobe → outfit pairings with a cohesion score | `claude-haiku-4-5-20251001` |

**To change the model:** edit the `model:` field in both `client.messages.create({...})` calls in `claudeService.ts`. There is no other place a model ID is configured — env vars, prompts, and types are model-agnostic.

Known-good model IDs, cheapest to most capable:
- `claude-haiku-4-5-20251001` — current choice. Fast (~2–4s per call), cheap, good enough for structured JSON extraction and outfit reasoning.
- `claude-sonnet-4-6` — used before the Haiku switch. Noticeably better nuance on busy patterns, ambiguous fabrics, and subtle style clashes; ~2–3x slower and costlier.

If you switch models, **verify both call sites still return valid JSON** — the prompts (`backend/src/prompts/garmentAnalysis.ts`, `backend/src/prompts/outfitSuggestions.ts`) demand JSON-only output with no markdown fences, and `claudeService.ts` strips ` ```json ` fences defensively before `JSON.parse`. A weaker model may need a stricter prompt or a retry/repair step.

## Local development

**Backend:** `cd backend && npm run dev` — listens on `PORT` (default 3001), binds all interfaces so it's reachable from a phone on the same LAN.

**Mobile:** `cd apps/mobile && npx expo start -c --host lan`
- `apps/mobile/.env` → `EXPO_PUBLIC_API_URL` must point at the **Mac's LAN IP** (not `localhost`) to be reachable from a physical device — e.g. `http://192.168.1.4:3001`.
- **Expo Go compatibility:** the project is pinned to **Expo SDK 54** because that's what public Expo Go supports on this dev's device (check via Expo Go → Settings → App Info → "Supported SDK"). Do not bump `expo`/`react-native`/`expo-router` past what the target Expo Go build supports without checking that first — a mismatch fails at launch with "Project is incompatible with this version of Expo Go," not a build error.
- To test on a physical iPhone: phone and Mac must be on the **same Wi-Fi**. Open Safari on the phone and navigate to `exp://<mac-lan-ip>:8081`.

## Notes
- `.env` files (mobile and backend) hold real secrets (Supabase service role key, Anthropic API key) — never commit them; both are gitignored.
- Background removal on wardrobe photos uses `@imgly/background-removal-node` (in `backend/src/services/imageService.ts`), flattened onto an off-white backdrop — separate from the Claude model config above.
