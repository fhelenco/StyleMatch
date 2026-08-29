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
