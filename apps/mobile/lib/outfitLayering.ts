import type { ClothingItem } from '../stores/wardrobeStore';

// Tops that read as a layer — can be (and often are) worn open over another top.
const LAYER_TOP_RE =
  /button.?up|button.?down|overshirt|shirt.?jacket|linen shirt|oxford shirt|flannel|chore(?: ?coat)?|open shirt|kimono|cardigan|duster/i;

export function isLayeringTop(item: ClothingItem): boolean {
  return item.category === 'tops' && LAYER_TOP_RE.test(item.label ?? '');
}

/**
 * True when a look already has a jacket (or an open/layering shirt) but no
 * plain base top under it — the moment to nudge "add a top underneath".
 */
export function needsBaseLayer(items: ClothingItem[]): boolean {
  const hasOuterwear = items.some((i) => i.category === 'outerwear');
  const tops = items.filter((i) => i.category === 'tops');
  const hasLayeringTop = tops.some((t) => LAYER_TOP_RE.test(t.label ?? ''));
  const hasPlainBaseTop = tops.some((t) => !LAYER_TOP_RE.test(t.label ?? ''));
  return (hasOuterwear || hasLayeringTop) && !hasPlainBaseTop;
}
