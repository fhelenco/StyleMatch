import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { adminSupabase } from '../services/supabaseService';

const router = Router();

const LogOutfitSchema = z.object({
  worn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  outfit_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const month = req.query.month as string | undefined;
    let query = adminSupabase
      .from('outfit_calendar')
      .select('*, outfits(*)')
      .eq('user_id', req.userId!)
      .order('worn_date', { ascending: true });

    if (month) {
      const [year, m] = month.split('-');
      const start = `${year}-${m}-01`;
      const end = new Date(Number(year), Number(m), 0).toISOString().split('T')[0];
      query = query.gte('worn_date', start).lte('worn_date', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = LogOutfitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { data, error } = await adminSupabase
      .from('outfit_calendar')
      .upsert(
        { ...parsed.data, user_id: req.userId },
        { onConflict: 'user_id,worn_date' }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('log outfit error:', err);
    res.status(500).json({ error: 'Failed to log outfit' });
  }
});

router.delete('/:date', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await adminSupabase
      .from('outfit_calendar')
      .delete()
      .eq('worn_date', req.params.date)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete calendar entry' });
  }
});

export default router;
