import type { ClothingItem } from '../stores/wardrobeStore';

/**
 * Derives a "style DNA" profile from the user's wardrobe, entirely on-device.
 * No backend call — it reads the tags/fabric/colors already stored on each item
 * (produced by the Claude garment analysis) and folds them into five aesthetic
 * axes plus two spectrums. Items worn more often count for more.
 */

export interface StyleAxis {
  key: AxisKey;
  label: string;
  /** 0..1, relative to the strongest axis in this wardrobe */
  value: number;
}

export interface StyleDna {
  axes: StyleAxis[];
  /** 0 = fully structured, 1 = fully fluid */
  structuredFluid: number;
  /** 0 = monochrome, 1 = vibrant */
  monochromeVibrant: number;
  /** e.g. "Minimalist Ethereal" */
  curatedStyle: string;
  /** number of garments that fed the profile */
  sampleSize: number;
}

type AxisKey = 'avant' | 'minimal' | 'classic' | 'boho' | 'street';

// Clockwise from the top vertex so the radar matches the mockup layout.
const AXES: { key: AxisKey; label: string; keywords: string[] }[] = [
  {
    key: 'avant',
    label: 'AVANT-GARDE',
    keywords: [
      'avant', 'asymmetric', 'asymmetrical', 'deconstruct', 'sculptural',
      'statement', 'bold', 'edgy', 'experimental', 'dramatic', 'architectural',
      'abstract', 'cut-out', 'cutout', 'exaggerated', 'unconventional',
    ],
  },
  {
    key: 'minimal',
    label: 'MINIMAL',
    keywords: [
      'minimal', 'minimalist', 'clean', 'simple', 'plain', 'basic', 'essential',
      'understated', 'sleek', 'streamlined', 'solid', 'unembellished', 'crisp',
    ],
  },
  {
    key: 'classic',
    label: 'CLASSIC',
    keywords: [
      'classic', 'timeless', 'tailored', 'blazer', 'trench', 'oxford', 'loafer',
      'pleated', 'wool', 'cashmere', 'preppy', 'heritage', 'houndstooth',
      'pinstripe', 'button-down', 'button-up', 'polo', 'refined', 'elegant',
    ],
  },
  {
    key: 'boho',
    label: 'BOHO',
    keywords: [
      'boho', 'bohemian', 'floral', 'paisley', 'crochet', 'fringe', 'flowy',
      'peasant', 'embroidered', 'linen', 'maxi', 'earthy', 'tie-dye', 'gauze',
      'ruffle', 'ruffled', 'tiered', 'folk', 'artisan',
    ],
  },
  {
    key: 'street',
    label: 'STREET',
    keywords: [
      'street', 'streetwear', 'oversized', 'hoodie', 'sneaker', 'sneakers',
      'cargo', 'denim', 'graphic', 'sporty', 'athletic', 'utility', 'bomber',
      'track', 'boxy', 'baggy', 'puffer', 'logo', 'skate',
    ],
  },
];

const STRUCTURED_KEYWORDS = [
  'blazer', 'tailored', 'denim', 'structured', 'coat', 'leather', 'boxy',
  'crisp', 'poplin', 'canvas', 'wool', 'tweed', 'suit', 'trench', 'stiff',
  'corduroy', 'quilted', 'boiled',
];
const FLUID_KEYWORDS = [
  'silk', 'satin', 'jersey', 'knit', 'knitted', 'drape', 'draped', 'flowy',
  'chiffon', 'slip', 'dress', 'viscose', 'modal', 'cupro', 'rayon', 'soft',
  'fluid', 'georgette', 'crepe', 'ribbed',
];

function itemText(item: ClothingItem): string {
  return [
    item.label,
    item.garment_type,
    item.style_category,
    item.pattern,
    item.fabric,
    item.season,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function weight(item: ClothingItem): number {
  // A garment worn a lot is more representative of the person's taste.
  return 1 + Math.min(item.times_worn, 10) * 0.5;
}

function countMatches(text: string, keywords: string[]): number {
  let n = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) n += 1;
  }
  return n;
}

function hexToHsl(hex: string): { s: number; l: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

function isVibrant(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  if (hsl.l < 0.12 || hsl.l > 0.92) return false; // near black / near white
  return hsl.s >= 0.28;
}

function pickCuratedStyle(
  topAxis: AxisKey,
  structuredFluid: number,
  monochromeVibrant: number,
): string {
  const first: Record<AxisKey, string> = {
    minimal: 'Minimalist',
    classic: 'Refined',
    boho: 'Bohemian',
    street: 'Urban',
    avant: 'Avant-Garde',
  };
  let second: string;
  if (structuredFluid >= 0.62) second = 'Ethereal';
  else if (structuredFluid <= 0.38) second = 'Tailored';
  else if (monochromeVibrant >= 0.6) second = 'Vivid';
  else if (monochromeVibrant <= 0.32) second = 'Monochrome';
  else second = 'Balanced';
  return `${first[topAxis]} ${second}`;
}

const EMPTY_DNA: StyleDna = {
  axes: AXES.map((a) => ({ key: a.key, label: a.label, value: 0.34 })),
  structuredFluid: 0.5,
  monochromeVibrant: 0.5,
  curatedStyle: 'Yet To Emerge',
  sampleSize: 0,
};

export function computeStyleDna(items: ClothingItem[]): StyleDna {
  if (!items || items.length === 0) return EMPTY_DNA;

  const raw: Record<AxisKey, number> = {
    avant: 0, minimal: 0, classic: 0, boho: 0, street: 0,
  };
  let structuredScore = 0;
  let fluidScore = 0;
  let vibrantWeight = 0;
  let colorWeight = 0;

  for (const item of items) {
    const text = itemText(item);
    const w = weight(item);

    for (const axis of AXES) {
      raw[axis.key] += countMatches(text, axis.keywords) * w;
    }

    structuredScore += countMatches(text, STRUCTURED_KEYWORDS) * w;
    fluidScore += countMatches(text, FLUID_KEYWORDS) * w;

    for (const c of item.colors ?? []) {
      colorWeight += w;
      if (isVibrant(c.hex)) vibrantWeight += w;
    }
  }

  const maxRaw = Math.max(...Object.values(raw));
  const axes: StyleAxis[] = AXES.map((a) => ({
    key: a.key,
    label: a.label,
    // Floor keeps the polygon from collapsing into the centre.
    value: maxRaw === 0 ? 0.34 : Math.max(0.12, raw[a.key] / maxRaw),
  }));

  const spectrumTotal = structuredScore + fluidScore;
  const structuredFluid = spectrumTotal === 0 ? 0.5 : fluidScore / spectrumTotal;
  const monochromeVibrant = colorWeight === 0 ? 0.4 : vibrantWeight / colorWeight;

  const topAxis = axes.reduce((a, b) => (b.value > a.value ? b : a)).key;

  return {
    axes,
    structuredFluid,
    monochromeVibrant,
    curatedStyle: pickCuratedStyle(topAxis, structuredFluid, monochromeVibrant),
    sampleSize: items.length,
  };
}
