# StyleMatch — Prompt para Claude Code

> Cole este prompt inteiro no Claude Code para gerar o projeto completo.

---

Build a full-stack cross-platform fashion assistant app called **StyleMatch**.

## Architecture overview

```
stylematch/
├── apps/
│   └── mobile/          # React Native + Expo (iOS, Android, Desktop)
└── backend/             # Node.js + Express API server
```

**Frontend**: React Native + Expo (covers iOS, Android, macOS, Windows)
**Backend**: Node.js + Express — handles all Anthropic API calls and business logic
**Database + Storage**: Supabase (PostgreSQL + Storage Buckets + Auth)
**AI**: Anthropic Claude API (claude-sonnet-4-6) with vision — called only from the backend

---

## PART 1 — SUPABASE SETUP

### Database schema (run in Supabase SQL editor)

```sql
-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  avatar_url text,
  preferred_language text default 'pt-BR',
  preferred_theme text default 'system',
  created_at timestamptz default now()
);

-- Clothing items (wardrobe)
create table public.clothing_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null,                        -- e.g. "Blazer Navy Slim"
  garment_type text not null,                 -- e.g. "blazer", "chinos", "sneakers"
  category text not null,                     -- tops | bottoms | shoes | accessories | outerwear
  style_category text,                        -- casual | smart-casual | formal | streetwear | etc.
  pattern text,                               -- solid | stripes | floral | plaid | etc.
  fabric text,                                -- cotton | denim | silk | leather | etc.
  season text,                                -- spring-summer | fall-winter | all-season
  colors jsonb not null default '[]',         -- [{ name: "navy", hex: "#1B2A4A" }]
  image_url text not null,                    -- Supabase Storage public URL
  image_path text not null,                   -- Supabase Storage path (for deletion)
  times_worn int default 0,
  last_worn_at date,
  notes text,
  created_at timestamptz default now()
);

-- Saved outfits
create table public.outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text,                                  -- user-given name or AI-suggested
  occasion text,                              -- casual | work | date-night | weekend | formal | gym
  season text,
  style_notes text,                           -- AI explanation of why it works
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- Items that belong to each outfit (junction table)
create table public.outfit_items (
  outfit_id uuid references public.outfits(id) on delete cascade,
  clothing_item_id uuid references public.clothing_items(id) on delete cascade,
  primary key (outfit_id, clothing_item_id)
);

-- Outfit calendar log
create table public.outfit_calendar (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  outfit_id uuid references public.outfits(id) on delete set null,
  worn_date date not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, worn_date)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.clothing_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.outfit_calendar enable row level security;

-- RLS Policies (users only see their own data)
create policy "Users can manage their own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users can manage their own clothing items"
  on public.clothing_items for all using (auth.uid() = user_id);

create policy "Users can manage their own outfits"
  on public.outfits for all using (auth.uid() = user_id);

create policy "Users can manage their own outfit items"
  on public.outfit_items for all
  using (outfit_id in (select id from public.outfits where user_id = auth.uid()));

create policy "Users can manage their own calendar"
  on public.outfit_calendar for all using (auth.uid() = user_id);
```

### Supabase Storage bucket

Create a bucket called `wardrobe-images` with these settings:
- Public bucket: **yes** (so image URLs are publicly accessible)
- Allowed MIME types: `image/jpeg, image/png, image/webp`
- Max file size: 10MB

Add this Storage policy:
```sql
-- Users can only upload/delete their own images
create policy "Users manage their own wardrobe images"
  on storage.objects for all
  using (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## PART 2 — BACKEND (Node.js + Express)

### Stack
- Node.js 20+
- Express
- @supabase/supabase-js (admin client with service_role key)
- @anthropic-ai/sdk
- multer (image upload handling)
- sharp (image resizing before sending to Claude)
- jsonwebtoken (verify Supabase JWT tokens)
- dotenv
- cors
- helmet
- zod (input validation)

### Project structure

```
backend/
├── src/
│   ├── server.ts
│   ├── middleware/
│   │   ├── auth.ts          # Verify Supabase JWT
│   │   └── upload.ts        # Multer config
│   ├── routes/
│   │   ├── wardrobe.ts      # CRUD clothing items + image upload
│   │   ├── outfits.ts       # Generate + manage outfits
│   │   └── calendar.ts      # Outfit calendar
│   ├── services/
│   │   ├── claudeService.ts # All Anthropic API calls
│   │   ├── supabaseService.ts
│   │   └── imageService.ts  # Resize + convert images
│   ├── prompts/
│   │   ├── garmentAnalysis.ts
│   │   └── outfitSuggestions.ts
│   └── types/
│       └── index.ts
├── .env
└── package.json
```

### Environment variables (.env)

```env
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ALLOWED_ORIGINS=http://localhost:8081,https://yourdomain.com
```

### Auth middleware (src/middleware/auth.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.userId = user.id;
  next();
}
```

### Claude service (src/services/claudeService.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { GARMENT_ANALYSIS_PROMPT, buildOutfitSuggestionsPrompt } from '../prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeGarment(base64Image: string, mediaType: string) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType as any, data: base64Image }
        },
        { type: 'text', text: GARMENT_ANALYSIS_PROMPT }
      ]
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function generateOutfitSuggestions(
  anchorItem: any,
  wardrobe: any[]
) {
  const prompt = buildOutfitSuggestionsPrompt(anchorItem, wardrobe);
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
```

### Garment analysis prompt (src/prompts/garmentAnalysis.ts)

```typescript
export const GARMENT_ANALYSIS_PROMPT = `
Analyze this clothing item photo and respond ONLY with a valid JSON object — no markdown, no preamble.

Return exactly this structure:
{
  "label": "Short user-friendly name (e.g. 'Blazer Navy Slim')",
  "garment_type": "specific type (e.g. blazer, chinos, chelsea boots, midi skirt)",
  "category": "one of: tops | bottoms | shoes | accessories | outerwear",
  "style_category": "one of: casual | smart-casual | formal | streetwear | athleisure | boho | minimalist | preppy | grunge",
  "pattern": "one of: solid | stripes | floral | plaid | geometric | animal-print | abstract | graphic | tie-dye",
  "fabric": "detected fabric if visible (e.g. cotton, denim, silk, wool, leather, linen, polyester, or 'unknown')",
  "season": "one of: spring-summer | fall-winter | all-season",
  "colors": [
    { "name": "color name", "hex": "#HEXCODE" }
  ]
}

Colors array: include 1–3 colors ordered by dominance (most dominant first).
Be specific with color names (e.g. 'dusty rose' not just 'pink', 'cobalt blue' not just 'blue').
`;
```

### Outfit suggestions prompt (src/prompts/outfitSuggestions.ts)

```typescript
export function buildOutfitSuggestionsPrompt(anchorItem: any, wardrobe: any[]): string {
  const wardrobeList = wardrobe
    .filter(item => item.id !== anchorItem.id)
    .map(item => ({
      id: item.id,
      label: item.label,
      category: item.category,
      style_category: item.style_category,
      colors: item.colors,
      fabric: item.fabric,
      pattern: item.pattern,
      season: item.season
    }));

  return `
You are an expert fashion stylist with deep knowledge of color theory, fabric compatibility, and contemporary style.

The user wants outfit suggestions built around this anchor piece:
${JSON.stringify(anchorItem, null, 2)}

Their wardrobe contains these items:
${JSON.stringify(wardrobeList, null, 2)}

Generate 3 to 5 outfit combinations. Apply these fashion rules:

COLOR RULES:
- Use complementary, analogous, triadic, or monochromatic color schemes
- Neutrals (black, white, navy, grey, beige, camel, ivory) pair with almost anything
- Follow the 60-30-10 rule for color balance
- Avoid clashing colors unless intentionally bold/editorial

FABRIC RULES:
- Match fabric weight to season
- Avoid too many competing textures in one outfit
- Mix textures intentionally: e.g. smooth + textured, matte + subtle sheen

PROPORTION RULES:
- Oversized top → slim or tapered bottom
- Fitted top → wide-leg or relaxed bottom
- Balance volume: avoid oversized everything unless intentional streetwear

STYLE COHERENCE:
- Items should share a style language (casual with casual, formal with formal, or intentional mixing)
- Smart-casual is the bridge between formal and casual
- Mention when a look is timeless vs on-trend

Respond ONLY with a valid JSON array — no markdown, no preamble:
[
  {
    "item_ids": ["uuid1", "uuid2", "uuid3"],
    "occasion": "one of: casual | work | date-night | weekend | formal | gym",
    "season": "spring-summer | fall-winter | all-season",
    "style_vibe": "2-3 word vibe (e.g. 'effortless chic', 'sharp minimalist')",
    "style_notes": "2-3 sentences explaining WHY this combination works — colors, proportions, occasion fit",
    "trend_note": "timeless | on-trend | classic-with-a-twist"
  }
]
`;
}
```

### API routes (src/routes/wardrobe.ts)

```typescript
// POST /api/wardrobe/analyze   — send image, get AI analysis back (no save yet)
// POST /api/wardrobe           — save item after user confirms analysis
// GET  /api/wardrobe           — list all items for authenticated user
// GET  /api/wardrobe/:id       — single item
// PATCH /api/wardrobe/:id      — update item (label, notes, etc.)
// DELETE /api/wardrobe/:id     — delete item + remove image from Supabase Storage
```

Image upload flow:
1. Client sends `multipart/form-data` with image file
2. Backend uses `multer` (memory storage) to receive the buffer
3. `sharp` resizes image to max 1200px, converts to JPEG, optimizes quality
4. Upload to Supabase Storage at path `{userId}/{itemId}.jpg`
5. Get public URL from Supabase Storage
6. Send resized buffer as base64 to Claude for analysis
7. Return analysis JSON to client (client confirms, then POSTs to save)

```typescript
// src/routes/outfits.ts
// POST /api/outfits/suggest/:anchorItemId  — generate AI suggestions for an anchor piece
// POST /api/outfits                        — save an outfit the user liked
// GET  /api/outfits                        — list saved outfits
// GET  /api/outfits/:id                    — outfit detail with all items expanded
// PATCH /api/outfits/:id                   — toggle favorite, rename
// DELETE /api/outfits/:id                  — delete saved outfit

// src/routes/calendar.ts
// GET  /api/calendar?month=2024-11         — get calendar entries for a month
// POST /api/calendar                       — log an outfit for a date
// DELETE /api/calendar/:date              — remove log for a date
```

---

## PART 3 — MOBILE APP (React Native + Expo)

### Stack
- Expo SDK 51+
- Expo Router v3 (file-based navigation)
- NativeWind v4 (Tailwind for React Native)
- @supabase/supabase-js (auth + realtime)
- expo-camera + expo-image-picker
- expo-secure-store (store auth tokens)
- expo-file-system
- Zustand (client state)
- React Query / TanStack Query (server state + caching)
- react-native-reanimated (animations)
- react-native-gesture-handler

### Environment variables (apps/mobile/.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### App structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── wardrobe.tsx        # Wardrobe grid
│   │   ├── suggestions.tsx     # Outfit suggestions
│   │   ├── calendar.tsx        # Outfit calendar
│   │   └── profile.tsx         # Settings + profile
│   ├── add-item/
│   │   ├── capture.tsx         # Camera / gallery picker
│   │   ├── confirm.tsx         # Review AI analysis, edit before saving
│   │   └── success.tsx
│   ├── outfit/
│   │   └── [id].tsx            # Outfit detail + moodboard
│   └── _layout.tsx             # Root layout with auth guard
├── components/
│   ├── wardrobe/
│   │   ├── WardrobeGrid.tsx    # Responsive grid (2 cols mobile, 4+ desktop)
│   │   ├── ClothingCard.tsx    # Item thumbnail card
│   │   └── CategoryFilter.tsx  # Horizontal filter chips
│   ├── outfits/
│   │   ├── OutfitCard.tsx      # Outfit suggestion card
│   │   ├── MoodBoard.tsx       # Collage of item thumbnails
│   │   └── OccasionBadge.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── ColorSwatch.tsx
│   │   └── LoadingOverlay.tsx
│   └── auth/
│       └── AuthGuard.tsx
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── api.ts                  # Fetch wrapper for backend API calls
│   └── imageUtils.ts           # Pick, resize, convert to base64
├── stores/
│   ├── authStore.ts            # Supabase session
│   └── wardrobeStore.ts        # Local cache of wardrobe items
└── hooks/
    ├── useWardrobe.ts          # TanStack Query hooks
    └── useOutfits.ts
```

### Auth flow (lib/supabase.ts + stores/authStore.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true, persistSession: true } }
);
```

### API client (lib/api.ts)

```typescript
// Always attach the Supabase JWT to every backend request
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiRequest(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}
```

### Add Item flow

```typescript
// Step 1: capture.tsx
// - Show two options: Camera button and Gallery button
// - On camera: use expo-camera, allow crop
// - On gallery: use expo-image-picker with allowsEditing: true

// Step 2: After image selected, call backend analyze endpoint
const analyzeImage = async (imageUri: string) => {
  const base64 = await imageUtils.toBase64(imageUri);
  const formData = new FormData();
  formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'item.jpg' } as any);

  const result = await fetch(`${API_URL}/api/wardrobe/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return result.json(); // returns Claude's garment analysis
};

// Step 3: confirm.tsx
// - Show the image + AI analysis results
// - Allow editing: label, category, season, notes
// - Color swatches shown visually
// - "Save to Wardrobe" button → POST /api/wardrobe
```

---

## PART 4 — UI DESIGN SYSTEM

### Design aesthetic
Editorial, clean, fashion-forward — inspired by high-end lookbooks and minimal fashion apps.

### Color tokens (tailwind.config.js)
```javascript
colors: {
  background: '#FAFAFA',       // off-white
  surface: '#FFFFFF',
  'surface-alt': '#F5F0ED',    // warm grey
  foreground: '#1A1A1A',       // deep charcoal
  muted: '#8C8C8C',
  accent: '#C9A99A',           // dusty rose
  'accent-dark': '#A07B6F',
  border: '#E8E2DE',
  success: '#4CAF82',
  warning: '#E8A838',
  error: '#E05C5C',
}
```

### Typography
```javascript
fontFamily: {
  display: ['PlayfairDisplay_700Bold'],    // headers, titles
  body: ['Inter_400Regular'],             // body text
  'body-medium': ['Inter_500Medium'],
  'body-bold': ['Inter_700Bold'],
  mono: ['JetBrainsMono_400Regular'],     // labels, tags
}
```

### Component guidelines

**ClothingCard**:
- Rounded corners (radius 16)
- Image fills card (aspect ratio 3:4 — portrait, like clothing photos)
- Bottom gradient overlay with item label
- Color swatches row at bottom (small circles, max 3)
- Subtle shadow on card

**OutfitCard**:
- Full width card
- MoodBoard component shows 2–4 item thumbnails in a grid collage
- Below: occasion badge, season badge, style_vibe in serif italic
- style_notes in small muted text
- "Save Outfit" button
- Expand arrow to see full explanation

**WardrobeGrid**:
- useWindowDimensions() to determine columns:
  - < 400px: 2 columns
  - 400–768px: 3 columns
  - 768–1200px: 4 columns
  - > 1200px: 5–6 columns
- Masonry or uniform grid (uniform preferred for simplicity)
- Sticky category filter at top

**Empty states**: use beautiful illustrated messages
- Wardrobe empty: "Your wardrobe awaits. Add your first piece."
- No suggestions: "Select a piece from your wardrobe to get started."

---

## PART 5 — DEVELOPMENT ORDER

Build in this exact order:

1. **Supabase setup** — run SQL schema, create storage bucket, get credentials
2. **Backend scaffold** — Express server, auth middleware, health check route
3. **Backend wardrobe routes** — image upload → Claude analysis → save to Supabase
4. **Backend outfits route** — generate suggestions from wardrobe
5. **Mobile auth screens** — Login + Register using Supabase Auth
6. **Mobile API client** — apiRequest wrapper with JWT
7. **Mobile Add Item flow** — camera/gallery → analyze → confirm → save
8. **Mobile Wardrobe screen** — grid with category filter
9. **Mobile Suggestions screen** — pick anchor item → show outfit cards
10. **Mobile Calendar screen** — log outfits by date
11. **Polish + animations** — reanimated transitions, loading states, empty states

---

## PART 6 — KEY IMPLEMENTATION NOTES

- **Never call the Anthropic API from the mobile app** — always go through the backend
- **Image optimization**: always resize images to max 1200px before uploading to Supabase Storage and before sending to Claude (reduces costs and latency)
- **Token refresh**: Supabase handles this automatically with `autoRefreshToken: true`
- **Offline**: cache wardrobe data locally with Zustand persist + AsyncStorage so the wardrobe grid loads instantly even without network
- **Error handling**: wrap all Claude API calls in try/catch with user-friendly error messages
- **Rate limiting**: add express-rate-limit to the backend (max 30 requests/min per user) to prevent abuse
- **CORS**: configure backend to only accept requests from your Expo origin

---

## PART 7 — DEPLOYMENT (when ready)

**Backend**: Deploy to Railway, Render, or Fly.io
- Set all env vars in the platform dashboard
- Use a Dockerfile or the platform's Node buildpack

**Mobile**: 
- Development: `npx expo start`
- Production: build with EAS Build (`npx eas build`)
- Submit to App Store + Play Store with EAS Submit

**Environment management**:
- Local dev: `.env.local` files
- Production: platform environment variables
- Never commit API keys to git — use `.gitignore` on all `.env` files
