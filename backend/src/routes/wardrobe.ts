import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { resizeImage, removeImageBackground, bufferToBase64 } from '../services/imageService';
import { uploadToStorage, deleteFromStorage, adminSupabase } from '../services/supabaseService';
import { analyzeGarment } from '../services/claudeService';

const router = Router();

const SaveItemSchema = z.object({
  label: z.string().min(1),
  garment_type: z.string().min(1),
  category: z.enum(['tops', 'bottoms', 'shoes', 'accessories', 'outerwear']),
  style_category: z.string().optional(),
  pattern: z.string().optional(),
  fabric: z.string().optional(),
  season: z.string().optional(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  image_url: z.string().url(),
  image_path: z.string(),
  notes: z.string().optional(),
});

router.post('/analyze', requireAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    let processed: Buffer;
    try {
      processed = await removeImageBackground(req.file.buffer);
    } catch (bgErr) {
      console.warn('Background removal failed, using original image:', bgErr);
      processed = await resizeImage(req.file.buffer);
    }

    const base64 = bufferToBase64(processed);
    const itemId = uuidv4();

    const { url, path } = await uploadToStorage(req.userId!, itemId, processed);
    const analysis = await analyzeGarment(base64, 'image/jpeg');

    res.json({ ...analysis, image_url: url, image_path: path, temp_id: itemId });
  } catch (err) {
    console.error('analyze error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SaveItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { data, error } = await adminSupabase
      .from('clothing_items')
      .insert({ ...parsed.data, user_id: req.userId })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('save item error:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    let query = adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('list items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await adminSupabase
      .from('clothing_items')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['label', 'notes', 'style_category', 'season', 'pattern', 'fabric', 'times_worn', 'last_worn_at', 'image_url', 'image_path', 'colors'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const { data, error } = await adminSupabase
      .from('clothing_items')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: item, error: fetchError } = await adminSupabase
      .from('clothing_items')
      .select('image_path')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (fetchError || !item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    await deleteFromStorage(item.image_path);

    const { error } = await adminSupabase
      .from('clothing_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
