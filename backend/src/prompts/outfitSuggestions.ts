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

Generate 3 to 5 outfit combinations, each built around the anchor piece.

OUTFIT COMPLETENESS (most important — do not violate):
- Every outfit MUST be a complete head-to-toe look including the anchor piece.
- It MUST contain a bottom garment (trousers, jeans, skirt, shorts, leggings) OR a one-piece (dress, jumpsuit) — unless the anchor piece itself already is one.
- NEVER return a look that is only tops and/or outerwear and shoes. A blazer or jacket does NOT count as a bottom.
- Add a top when the look is not a one-piece; add shoes when the wardrobe has any.
- LAYERING: if the outfit includes ANY outerwear (jacket, blazer, coat, cardigan, overshirt/shirt-jacket), it MUST ALSO include a separate base top (t-shirt, tank, blouse, knit top, bodysuit) worn underneath it — never outerwear over bare skin. A look with a jacket therefore has at least 4 pieces: base top + jacket + bottom + shoes.
- Outerwear is otherwise optional, layered on top of an already-complete outfit.
- Only skip a bottom if the wardrobe genuinely has no bottoms and no one-pieces.

Apply these fashion rules:

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
    "occasion": "one of: casual | work | date-night | weekend | formal | gym | party | beach | bar",
    "season": "spring | summer | fall | winter | all-season",
    "style_vibe": "2-3 word vibe (e.g. 'effortless chic', 'sharp minimalist')",
    "style_notes": "2-3 sentences explaining WHY this combination works — colors, proportions, occasion fit",
    "trend_note": "timeless | on-trend | classic-with-a-twist"
  }
]
`;
}

export function buildOccasionOutfitPrompt(
  occasion: string,
  season: string | undefined,
  wardrobe: object[],
  anchorItem?: object
): string {
  const wardrobeList = (wardrobe as Array<Record<string, unknown>>)
    .filter((item) => !anchorItem || (item as { id: string }).id !== (anchorItem as { id: string }).id)
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

The user wants a full outfit built from scratch for this occasion: ${occasion}
${season ? `Target season: ${season}` : 'No specific season constraint — pick pieces appropriate for any season.'}
${
  anchorItem
    ? `\nEvery outfit MUST be built around this specific base piece, which the user has already chosen:\n${JSON.stringify(anchorItem, null, 2)}\nEvery item_ids array must include this piece's id ("${(anchorItem as { id: string }).id}"), styled to fit the occasion and season above.\n`
    : ''
}
Their wardrobe contains these items:
${JSON.stringify(wardrobeList, null, 2)}

Generate 3 to 5 outfit combinations suited to this occasion${season ? ' and season' : ''}${anchorItem ? ', all built around the base piece above,' : ''} using ONLY items from the wardrobe above${anchorItem ? ' plus the base piece' : ''}.

OUTFIT COMPLETENESS (most important — do not violate):
- Every outfit MUST be a complete head-to-toe look. It MUST include a bottom garment (trousers, jeans, skirt, shorts, leggings) OR a one-piece (dress, jumpsuit, romper).
- NEVER return a look that is only a top and/or outerwear and shoes. A blazer or jacket does NOT count as a bottom and does NOT replace one.
- Add a top whenever the look is not a one-piece. Add shoes whenever the wardrobe contains any.
- LAYERING: if the outfit includes ANY outerwear (jacket, blazer, coat, cardigan, overshirt/shirt-jacket), it MUST ALSO include a separate base top (t-shirt, tank, blouse, knit top, bodysuit) worn underneath it — never outerwear over bare skin. A look with a jacket therefore has at least 4 pieces: base top + jacket + bottom + shoes.
- Outerwear (blazer, coat, jacket) is otherwise optional and layered on top of an already-complete outfit.
- The only exception: if the wardrobe genuinely contains no bottoms and no one-pieces, return the best top + shoes pairing you can and say so in style_notes.
- Do not force unrelated items together just to pad the outfit.
- Do NOT stop at the bare minimum. If the wardrobe has an accessory (bag, belt, jewelry, hat, scarf, sunglasses) or a layering piece (outerwear, vest) that would genuinely elevate the look for this occasion, INCLUDE it — a stylist finishes a look, they don't just cover the body. Skip an accessory only when nothing in the wardrobe actually fits the outfit; never omit one just to keep the array short.

Apply these fashion rules:

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

Respond ONLY with a valid JSON array — no markdown, no preamble.
Order item_ids as: shoes, bottom (or one-piece), base top, then outerwear, then accessories.
The base top is always present unless the look is a one-piece; any outerwear comes AFTER it in the array.
[
  {
    "item_ids": ["shoesId", "bottomId", "baseTopId", "outerwearId", "accessoryId"],
    "cohesion_score": 0-100 integer reflecting how well the pieces work together,
    "occasion": "${occasion}",
    "season": "${season ?? 'all-season'}",
    "style_vibe": "2-3 word vibe (e.g. 'effortless chic', 'sharp minimalist')",
    "style_notes": "2-3 sentences explaining WHY this combination works for ${occasion}",
    "trend_note": "timeless | on-trend | classic-with-a-twist"
  }
]
`;
}

export function buildSwapPiecePrompt(
  category: string,
  occasion: string,
  season: string | undefined,
  keepItems: object[],
  candidates: object[]
): string {
  const candidateList = (candidates as Array<Record<string, unknown>>).map((item) => ({
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

The user has an outfit for this occasion: ${occasion}
${season ? `Target season: ${season}` : 'No specific season constraint.'}

These pieces are staying in the outfit and must NOT change:
${JSON.stringify(keepItems, null, 2)}

The user wants to swap out the current ${category} piece. Choose the ONE best replacement for it
from this list of other ${category} pieces in their wardrobe:
${JSON.stringify(candidateList, null, 2)}

Apply the same stylist judgment as building a full outfit:
- Color: complementary, analogous, triadic, or monochromatic with the pieces staying in the outfit
- Fabric: weight and texture appropriate for the season, not competing with what's staying
- Proportion: balances against what's staying (e.g. an oversized top calls for a slimmer replacement bottom)
- Style coherence: shares a style language with the rest of the outfit for this occasion

Respond ONLY with valid JSON — no markdown, no preamble:
{
  "item_id": "the chosen candidate's id, copied exactly from the list above",
  "cohesion_score": 0-100 integer for how well the full outfit (pieces staying + this replacement) works together,
  "style_notes": "1-2 sentences on why this replacement works"
}
`;
}
