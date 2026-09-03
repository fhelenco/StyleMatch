import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { adminSupabase } from '../services/supabaseService';
import {
  generateOutfitSuggestions,
  generateOutfitsForOccasion,
  swapOutfitPiece,
} from '../services/claudeService';

const router = Router();

// Kept in one place so the "save" and "generate by occasion" validators can't
// drift apart. Also mirrored in the prompt text in
// backend/src/prompts/outfitSuggestions.ts — update both if this ever changes.
const OCCASIONS = [
  'casual', 'work', 'date-night', 'weekend', 'formal', 'gym', 'party', 'beach', 'bar',
] as const;
// Kept the old grouped values (spring-summer, fall-winter) valid so existing
// saved outfits and wardrobe items never fail this check — new saves should
// use the granular spring/summer/fall/winter going forward.
const SEASONS = [
  'spring-summer', 'fall-winter', 'all-season', 'spring', 'summer', 'fall', 'winter',
] as const;

const SaveOutfitSchema = z.object({
  name: z.string().optional(),
  occasion: z.enum(OCCASIONS).optional(),
  season: z.enum(SEASONS).optional(),
  style_vibe: z.string().optional(),
  style_notes: z.string().optional(),
  trend_note: z.enum(['timeless', 'on-trend', 'classic-with-a-twist']).optional(),
  item_ids: z.array(z.string().uuid()).min(1),
});

const SuggestByOccasionSchema = z.object({
  occasion: z.enum(OCCASIONS),
  season: z.enum(SEASONS).optional(),
  anchor_item_id: z.string().uuid().optional(),
});

const SwapPieceSchema = z.object({
  keep_item_ids: z.array(z.string().uuid()),
  exclude_item_id: z.string().uuid(),
  category: z.enum(['tops', 'bottoms', 'shoes', 'accessories', 'outerwear']),
  occasion: z.enum(OCCASIONS),
  season: z.enum(SEASONS).optional(),
});

router.post('/suggest/:anchorItemId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: anchor, error: anchorError } = await adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('id', req.params.anchorItemId)
      .eq('user_id', req.userId!)
      .single();

    if (anchorError || !anchor) {
      res.status(404).json({ error: 'Anchor item not found' });
      return;
    }

    const { data: wardrobe, error: wardrobeError } = await adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', req.userId!);

    if (wardrobeError) throw wardrobeError;

    const suggestions = await generateOutfitSuggestions(anchor, wardrobe || []);
    res.json(suggestions);
  } catch (err) {
    console.error('suggest outfits error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

router.post('/suggest-by-occasion', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SuggestByOccasionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { occasion, season, anchor_item_id } = parsed.data;

    let anchor: unknown = undefined;
    if (anchor_item_id) {
      const { data: anchorItem, error: anchorError } = await adminSupabase
        .from('clothing_items')
        .select('*')
        .eq('id', anchor_item_id)
        .eq('user_id', req.userId!)
        .single();

      if (anchorError || !anchorItem) {
        res.status(404).json({ error: 'Base piece not found' });
        return;
      }
      anchor = anchorItem;
    }

    const { data: wardrobe, error: wardrobeError } = await adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', req.userId!);

    if (wardrobeError) throw wardrobeError;
    if (!wardrobe || wardrobe.length === 0) {
      res.status(400).json({ error: 'Wardrobe is empty — add items before generating a look' });
      return;
    }

    const suggestions = await generateOutfitsForOccasion(occasion, season, wardrobe, anchor as object | undefined);
    res.json(suggestions);
  } catch (err) {
    console.error('suggest by occasion error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

router.post('/swap-piece', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SwapPieceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { keep_item_ids, exclude_item_id, category, occasion, season } = parsed.data;

    const { data: wardrobe, error: wardrobeError } = await adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', req.userId!);

    if (wardrobeError) throw wardrobeError;
    const wardrobeItems = wardrobe || [];

    const keepItems = wardrobeItems.filter((i) => keep_item_ids.includes(i.id));
    const candidates = wardrobeItems.filter(
      (i) => i.category === category && i.id !== exclude_item_id && !keep_item_ids.includes(i.id)
    );

    if (candidates.length === 0) {
      res.status(400).json({ error: 'No alternative pieces available in this category' });
      return;
    }

    const result = await swapOutfitPiece(category, occasion, season, keepItems, candidates);
    const replacement = wardrobeItems.find((i) => i.id === result.item_id);
    if (!replacement) {
      res.status(500).json({ error: 'AI returned an item that is not a valid candidate' });
      return;
    }

    res.json({
      item: replacement,
      cohesion_score: result.cohesion_score,
      style_notes: result.style_notes,
    });
  } catch (err) {
    console.error('swap piece error:', err);
    res.status(500).json({ error: 'Failed to swap piece' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SaveOutfitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { item_ids, ...outfitFields } = parsed.data;

    const { data: outfit, error: outfitError } = await adminSupabase
      .from('outfits')
      .insert({ ...outfitFields, user_id: req.userId })
      .select()
      .single();

    if (outfitError) throw outfitError;

    const junctionRows = item_ids.map((id) => ({
      outfit_id: outfit.id,
      clothing_item_id: id,
    }));

    const { error: junctionError } = await adminSupabase
      .from('outfit_items')
      .insert(junctionRows);

    if (junctionError) throw junctionError;

    res.status(201).json(outfit);
  } catch (err) {
    console.error('save outfit error:', err);
    res.status(500).json({ error: 'Failed to save outfit' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: outfits, error } = await adminSupabase
      .from('outfits')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!outfits || outfits.length === 0) {
      res.json([]);
      return;
    }

    // Batch-attach each outfit's pieces (same shape as GET /:id) so the
    // lookbook list can show a real piece count and preview thumbnails
    // instead of always reading 0 pieces.
    const outfitIds = outfits.map((o) => o.id);
    const { data: junctionRows } = await adminSupabase
      .from('outfit_items')
      .select('outfit_id, clothing_item_id')
      .in('outfit_id', outfitIds);

    const itemIds = Array.from(
      new Set((junctionRows || []).map((r) => r.clothing_item_id))
    );

    let itemsById = new Map<string, unknown>();
    if (itemIds.length > 0) {
      const { data: clothingItems } = await adminSupabase
        .from('clothing_items')
        .select('*')
        .in('id', itemIds);
      itemsById = new Map((clothingItems || []).map((item) => [item.id, item]));
    }

    const itemsByOutfit = new Map<string, unknown[]>();
    for (const row of junctionRows || []) {
      const item = itemsById.get(row.clothing_item_id);
      if (!item) continue;
      const list = itemsByOutfit.get(row.outfit_id) || [];
      list.push(item);
      itemsByOutfit.set(row.outfit_id, list);
    }

    const withItems = outfits.map((outfit) => ({
      ...outfit,
      items: itemsByOutfit.get(outfit.id) || [],
    }));

    res.json(withItems);
  } catch (err) {
    console.error('list outfits error:', err);
    res.status(500).json({ error: 'Failed to fetch outfits' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: outfit, error } = await adminSupabase
      .from('outfits')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !outfit) {
      res.status(404).json({ error: 'Outfit not found' });
      return;
    }

    const { data: junctionRows } = await adminSupabase
      .from('outfit_items')
      .select('clothing_item_id')
      .eq('outfit_id', req.params.id);

    const itemIds = (junctionRows || []).map((r) => r.clothing_item_id);
    let items: unknown[] = [];

    if (itemIds.length > 0) {
      const { data: clothingItems } = await adminSupabase
        .from('clothing_items')
        .select('*')
        .in('id', itemIds);
      items = clothingItems || [];
    }

    res.json({ ...outfit, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch outfit' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'is_favorite', 'occasion', 'season'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const { data, error } = await adminSupabase
      .from('outfits')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Outfit not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update outfit' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await adminSupabase
      .from('outfits')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete outfit' });
  }
});

export default router;
