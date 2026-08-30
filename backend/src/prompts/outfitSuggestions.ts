export function buildOutfitSuggestionsPrompt(anchorItem: object, wardrobe: object[]): string {
  const wardrobeList = (wardrobe as Array<Record<string, unknown>>)
    .filter((item) => (item as { id: string }).id !== (anchorItem as { id: string }).id)
    .map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      style_category: item.style_category,
      colors: item.colors,
      fabric: item.fabric,
      pattern: item.pattern,
      season: item.season,
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

COHESION SCORE:
- Rate each outfit 0–100 for how well the pieces work together, judged on the color, fabric, proportion, and style rules above.
- Be honest and discriminating: a flawless, gallery-worthy pairing is 90+, a solid everyday look is 75–89, a workable but slightly off combination is 60–74, and a forced or clashing one is below 60.
- Vary the scores across suggestions — do not give every outfit the same number.

Order the array from highest cohesion_score to lowest.

Respond ONLY with a valid JSON array — no markdown, no preamble:
[
  {
    "item_ids": ["uuid1", "uuid2", "uuid3"],
    "cohesion_score": 0-100 integer reflecting how well the pieces work together,
    "occasion": "one of: casual | work | date-night | weekend | formal | gym",
    "season": "spring-summer | fall-winter | all-season",
    "style_vibe": "2-3 word vibe (e.g. 'effortless chic', 'sharp minimalist')",
    "style_notes": "2-3 sentences explaining WHY this combination works — colors, proportions, occasion fit",
    "trend_note": "timeless | on-trend | classic-with-a-twist"
  }
]
`;
}
