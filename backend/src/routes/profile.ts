import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { resizeImage } from '../services/imageService';
import { uploadToStorage, adminSupabase } from '../services/supabaseService';

const router = Router();

const UpdateProfileSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  preferred_language: z.string().optional(),
  preferred_theme: z.enum(['system', 'light', 'dark']).optional(),
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error('get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .update(parsed.data)
      .eq('id', req.userId!)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error('update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post(
  '/avatar',
  requireAuth,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image provided' });
        return;
      }

      const resized = await resizeImage(req.file.buffer);
      // Same bucket as wardrobe photos, under a fixed 'avatar' key per user so
      // re-uploads simply overwrite the previous picture.
      const { url } = await uploadToStorage(req.userId!, 'avatar', resized);

      const { data, error } = await adminSupabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', req.userId!)
        .select()
        .single();

      if (error || !data) {
        res.status(500).json({ error: 'Failed to save avatar' });
        return;
      }
      res.json(data);
    } catch (err) {
      console.error('avatar upload error:', err);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

router.delete('/avatar', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', req.userId!)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error('remove avatar error:', err);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

export default router;
