import type { ClothingItem } from '../stores/wardrobeStore';

/**
 * Heuristic "have I already added this piece?" check, run on-device against the
 * wardrobe before a new item is saved. There's no image fingerprint, so it
 * compares the AI-extracted attributes: same category, similar garment type and
 * name, overlapping colours. Tuned to only fire on a near-certain match — a
 * false negative (missing a dup) is much cheaper than nagging on every add.
 */

export interface DuplicateCandidate {
  label?: string;
  garment_type?: string;
  category?: string;
  style_category?: string;
  fabric?: string;
  pattern?: string;
  colors?: Array<{ name: string; hex: string }>;
}

const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();
const words = (s?: string | null) => norm(s).split(/[\s/-]+/).filter(Boolean);

function tokenOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = a.filter((w) => setB.has(w)).length;
  return shared / Math.max(a.length, b.length);
}

function colorOverlap(
  a?: Array<{ name: string }>,
  b?: Array<{ name: string }>,
): number {
  const ca = (a ?? []).map((c) => norm(c.name)).filter(Boolean);
  const cb = (b ?? []).map((c) => norm(c.name)).filter(Boolean);
  if (!ca.length || !cb.length) return 0;
  const setB = new Set(cb);
  const shared = ca.filter((c) => setB.has(c)).length;
  return shared / Math.max(ca.length, cb.length);
}

function score(candidate: DuplicateCandidate, item: ClothingItem): number {
  // Different category → not the same piece.
  if (candidate.category && item.category && norm(candidate.category) !== norm(item.category)) {
    return 0;
  }

  let s = 0;

  const gtC = norm(candidate.garment_type);
  const gtI = norm(item.garment_type);
  if (gtC && gtI && (gtC === gtI || gtC.includes(gtI) || gtI.includes(gtC))) s += 0.35;

  s += tokenOverlap(words(candidate.label), words(item.label)) * 0.35;
  s += colorOverlap(candidate.colors, item.colors) * 0.2;

  if (norm(candidate.style_category) && norm(candidate.style_category) === norm(item.style_category)) s += 0.05;
  if (norm(candidate.pattern) && norm(candidate.pattern) === norm(item.pattern)) s += 0.05;
  if (norm(candidate.fabric) && norm(candidate.fabric) === norm(item.fabric)) s += 0.05;

  return s;
}

/** Returns the closest existing item if it's a near-certain match, else null. */
export function findLikelyDuplicate(
  candidate: DuplicateCandidate,
  items: ClothingItem[],
): ClothingItem | null {
  let best: { item: ClothingItem; s: number } | null = null;
  for (const item of items) {
    const s = score(candidate, item);
    if (!best || s > best.s) best = { item, s };
  }
  return best && best.s >= 0.6 ? best.item : null;
}
