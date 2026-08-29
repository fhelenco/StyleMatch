import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { adminSupabase } from '../services/supabaseService';
import { generateOutfitSuggestions } from '../services/claudeService';

const router = Router();

const SaveOutfitSchema = z.object({
  name: z.string().optional(),
  occasion: z.enum(['casual', 'work', 'date-night', 'weekend', 'formal', 'gym']).optional(),
  season: z.enum(['spring-summer', 'fall-winter', 'all-season']).optional(),
  style_vibe: z.string().optional(),
  style_notes: z.string().optional(),
  trend_note: z.enum(['timeless', 'on-trend', 'classic-with-a-twist']).optional(),
  item_ids: z.array(z.string().uuid()).min(1),
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
    const { data, error } = await adminSupabase
      .from('outfits')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
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
