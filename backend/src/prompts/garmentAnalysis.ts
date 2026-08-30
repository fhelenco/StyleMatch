export const GARMENT_ANALYSIS_PROMPT = `
You are a fashion cataloguing assistant. Analyze this clothing item photo and respond ONLY with a valid JSON object — no markdown, no preamble.

Look closely at the garment itself. If a brand tag, care label, or any text is legible in the photo, read it and use that information.

Return exactly this structure:
{
  "label": "Short user-friendly name (e.g. 'Navy Slim Blazer')",
  "brand": "brand name if a logo or label is visibly readable, otherwise null",
  "garment_type": "specific type (e.g. blazer, cargo jeans, chelsea boots, midi skirt)",
  "category": "one of: tops | bottoms | shoes | accessories | outerwear",
  "collection": "a short seasonal collection name that fits the piece (e.g. 'Spring Collection', 'Fall Collection', 'Summer Essentials', 'Core Basics')",
  "style_category": "one of: casual | smart-casual | formal | streetwear | athleisure | boho | minimalist | preppy | grunge",
  "pattern": "one of: solid | stripes | floral | plaid | geometric | animal-print | abstract | graphic | tie-dye",
  "fabric": "detected fabric if visible (e.g. cotton, denim, silk, wool, leather, linen, polyester, or 'unknown')",
  "fabric_care": "2-3 short sentences of care guidance for this fabric. If a care label is legible in the photo, transcribe its instructions instead of inferring.",
  "season": "one of: spring-summer | fall-winter | all-season",
  "tags": ["5 to 8 short descriptive tags of one or two words each, e.g. 'Tailored', 'Lightweight', 'Oversized', 'Minimalist', 'Earth Tones'. Include the category, key colors, fabric, silhouette, and vibe."],
  "colors": [
    { "name": "color name", "hex": "#HEXCODE" }
  ]
}

Colors array: include 1–3 colors ordered by dominance (most dominant first).
Be specific with color names (e.g. 'dusty rose' not just 'pink', 'cobalt blue' not just 'blue').
`;
