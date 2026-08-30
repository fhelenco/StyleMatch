import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

export async function resizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Removes the background from a garment photo and flattens the cut-out onto a
 * clean off-white studio backdrop, so every wardrobe item reads as a product
 * shot regardless of where it was photographed. Falls back to a plain resize
 * if segmentation fails.
 */
export async function removeImageBackground(buffer: Buffer): Promise<Buffer> {
  // imgly sniffs the format from the Blob's MIME type, so normalize to PNG and
  // hand it a typed Blob (a bare Buffer is wrapped without a type and rejected).
  const png = await sharp(buffer).png().toBuffer();
  const inputBlob = new Blob([new Uint8Array(png)], { type: 'image/png' });

  const blob = await removeBackground(inputBlob, {
    output: { format: 'image/png', quality: 0.9 },
  });
  const cutout = Buffer.from(await blob.arrayBuffer());

  return sharp(cutout)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#F5F0ED' })
    .jpeg({ quality: 88 })
    .toBuffer();
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}
