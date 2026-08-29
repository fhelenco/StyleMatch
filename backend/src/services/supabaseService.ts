import { createClient } from '@supabase/supabase-js';

export const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadToStorage(
  userId: string,
  itemId: string,
  buffer: Buffer
): Promise<{ url: string; path: string }> {
  const path = `${userId}/${itemId}.jpg`;

  const { error } = await adminSupabase.storage
    .from('wardrobe-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = adminSupabase.storage.from('wardrobe-images').getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export async function deleteFromStorage(path: string): Promise<void> {
  const { error } = await adminSupabase.storage
    .from('wardrobe-images')
    .remove([path]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
