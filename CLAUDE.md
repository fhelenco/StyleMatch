# StyleMatch — Project Context

Full-stack fashion assistant app. React Native (Expo) mobile client + Node/Express backend + Supabase (DB, auth, storage).

## Repo layout
```
apps/mobile/    Expo Router app (React Native)
backend/        Express API + Claude/Anthropic integration
```

## AI model configuration

**All Claude API calls live in one file:** [`backend/src/services/claudeService.ts`](backend/src/services/claudeService.ts).

There are five call sites, and **all currently use the same model**:

| Function | Purpose | Model |
|---|---|---|
| `analyzeGarment()` | Vision call — photo → label, category, tags, fabric care, colors, brand, collection | `claude-haiku-4-5-20251001` |
| `generateOutfitSuggestions()` | Text call — anchor item + wardrobe → outfit pairings with a cohesion score | `claude-haiku-4-5-20251001` |
| `swapOutfitPiece()` | Text call — swap one piece in an existing outfit for a better wardrobe alternative | `claude-haiku-4-5-20251001` |
| `rescoreOutfit()` | Text call — fixed item set → fresh cohesion score + notes (after the user manually adds a piece) | `claude-haiku-4-5-20251001` |
| `generateOutfitsForOccasion()` | Text call — occasion (+ optional season) + wardrobe → outfit pairings with a cohesion score, no anchor item | `claude-haiku-4-5-20251001` |

**To change the model:** edit the `model:` field in all five `client.messages.create({...})` calls in `claudeService.ts`. There is no other place a model ID is configured — env vars, prompts, and types are model-agnostic.

Known-good model IDs, cheapest to most capable:
- `claude-haiku-4-5-20251001` — current choice. Cheapest, fastest (~2–4s per call), good enough for structured JSON extraction and outfit reasoning ($1/$5 per MTok).
- `claude-sonnet-4-6` — used before the latest Haiku switch. Noticeably better nuance on busy patterns, ambiguous fabrics, and subtle style clashes than Haiku 4.5; ~2–3x slower and costlier ($3/$15 per MTok).
- `claude-sonnet-5` — newer than 4.6, cheaper ($2/$10 per MTok), larger context; a reasonable next thing to try if Haiku's quality ever needs a bump without going all the way to 4.6's cost.

If you switch models, **verify all five call sites still return valid JSON** — the prompts (`backend/src/prompts/garmentAnalysis.ts`, `backend/src/prompts/outfitSuggestions.ts`) demand JSON-only output with no markdown fences, and `claudeService.ts` strips ` ```json ` fences defensively before `JSON.parse`. A weaker model may need a stricter prompt or a retry/repair step.

## User profile (avatar, username, preferences)

The Supabase `profiles` table (`id`, `username`, `avatar_url`, `preferred_language`, `preferred_theme`, `created_at`) is auto-populated per user on signup (one row per `auth.users` id) but isn't auto-wired to anything — it has to be read/written explicitly.

**Backend:** [`backend/src/routes/profile.ts`](backend/src/routes/profile.ts), mounted at `/api/profile`.
- `GET /api/profile` — fetch the caller's row
- `PATCH /api/profile` — update `username` / `preferred_language` / `preferred_theme`
- `POST /api/profile/avatar` (multipart `image`) — resizes, uploads to the **same** `wardrobe-images` Supabase Storage bucket used for clothing photos, at `{userId}/avatar.jpg` (fixed filename — re-uploading overwrites in place), then saves the public URL to `avatar_url`
- `DELETE /api/profile/avatar` — clears `avatar_url` only. **Known gap:** it does not delete the underlying file from Storage, so old avatars become orphaned (harmless — the next upload overwrites the same path — but worth fixing with a `deleteFromStorage` call if it ever matters).

**Mobile:** [`hooks/useProfile.ts`](apps/mobile/hooks/useProfile.ts) wraps the above as React Query hooks (`useProfile`, `useUpdateProfile`, `useUploadAvatar`, `useRemoveAvatar`), used in [`app/(tabs)/profile.tsx`](apps/mobile/app/(tabs)/profile.tsx). `stores/profileStore.ts` is **just a local cache** (AsyncStorage) so the avatar paints instantly on launch — the database is the source of truth, not the store.

Editing the username uses a reusable [`components/ui/PromptDialog.tsx`](apps/mobile/components/ui/PromptDialog.tsx) (text-input modal, same visual language as `ConfirmDialog`) — triggered from the pencil icon next to the name and from "Edit profile" in Account settings.

## Theming (light / dark)

Every screen and component is themed through a colour-token layer — **there are no hard-coded hex values in components** (the only exceptions are colour drawn *over the hero photo* and the garment placeholder swatches in `home.tsx`).

- **Tokens:** [`lib/theme.ts`](apps/mobile/lib/theme.ts) — `lightColors` / `darkColors` (`ThemeColors`). Dark is warm near-black (`#141110`), not pure black. Add a token here rather than hard-coding.
- **Context:** [`contexts/theme.tsx`](apps/mobile/contexts/theme.tsx) — `<ThemeProvider>` (mounted in `app/_layout.tsx` under `QueryClientProvider`). `useTheme()` → `{ colors, scheme, mode, setMode }`. `useThemedStyles(makeStyles)` builds a themed StyleSheet, memoised per palette.
- **Pattern in a file:** `const styles = useThemedStyles(makeStyles)` in the component; `const makeStyles = (c: ThemeColors) => StyleSheet.create({ ... c.foreground ... })` at the bottom. Inline colours (`Ionicons color=`, `placeholderTextColor`, gradient stops) come from `useTheme().colors`.
- **Source of truth:** `profiles.preferred_theme` (`system` | `light` | `dark`) via `useUpdateProfile`. [`stores/themeStore.ts`](apps/mobile/stores/themeStore.ts) is a local AsyncStorage cache so the right theme paints on launch; `ThemeProvider` reconciles the two and calls `Appearance.setColorScheme()` so native surfaces (Alert, ActionSheet) follow. The Theme segmented control in `app/(tabs)/profile.tsx` calls `setMode`.

## Local development

**Backend:** `cd backend && npm run dev` — listens on `PORT` (default 3001), binds all interfaces so it's reachable from a phone on the same LAN.

**Mobile:** `cd apps/mobile && npx expo start -c --host lan`
- `apps/mobile/.env` → `EXPO_PUBLIC_API_URL` must point at the **Mac's LAN IP** (not `localhost`) to be reachable from a physical device — e.g. `http://192.168.1.4:3001`.
- **Expo Go compatibility:** the project is pinned to **Expo SDK 54** because that's what public Expo Go supports on this dev's device (check via Expo Go → Settings → App Info → "Supported SDK"). Do not bump `expo`/`react-native`/`expo-router` past what the target Expo Go build supports without checking that first — a mismatch fails at launch with "Project is incompatible with this version of Expo Go," not a build error.
- To test on a physical iPhone: phone and Mac must be on the **same Wi-Fi**. Open Safari on the phone and navigate to `exp://<mac-lan-ip>:8081`.

## Notes
- `.env` files (mobile and backend) hold real secrets (Supabase service role key, Anthropic API key) — never commit them; both are gitignored.
- Background removal on wardrobe photos uses `@imgly/background-removal-node` (in `backend/src/services/imageService.ts`), flattened onto an off-white backdrop — separate from the Claude model config above.
- The stack screen for outfit matching is `app/matching.tsx` (renamed from `match.tsx`) — link to it as `/matching`, not `/match`. It accepts an optional `?anchor=<itemId>` param to pre-select a wardrobe piece (used by the item-detail screen's "Create Outfit" button).
