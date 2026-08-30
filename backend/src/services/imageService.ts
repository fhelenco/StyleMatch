import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

const OFF_WHITE = '#F5F0ED';
// 3:4 portrait — matches the wardrobe card aspect ratio, so every item reads
// as a uniform product shot in the grid.
const CARD_W = 1000;
const CARD_H = 1333;
const INNER_W = Math.round(CARD_W * 0.92);
const INNER_H = Math.round(CARD_H * 0.92);

export async function resizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Frames an arbitrary garment photo into a uniform 3:4 card: trims the empty
 * border, scales the garment to sit within ~92% of the card, and centres it on
 * an off-white backdrop. The output is always CARD_W x CARD_H regardless of how
 * the source photo was shot or cropped.
 */
async function frameToCard(
  buffer: Buffer,
  opts: { trimTransparent?: boolean } = {},
): Promise<Buffer> {
  let working = buffer;
  try {
    // On a cut-out the border is transparent; on a raw photo it's a roughly
    // uniform studio background. `.trim()` handles both (higher threshold for
    // the noisier raw-photo case). It throws on a single flat colour — ignore.
    working = await sharp(buffer)
      .trim(opts.trimTransparent ? { threshold: 5 } : { threshold: 18 })
      .toBuffer();
  } catch {
    working = buffer;
  }

  const inner = await sharp(working)
    .resize(INNER_W, INNER_H, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  return sharp(inner)
    .resize(CARD_W, CARD_H, {
      fit: 'contain',
      position: 'center',
      background: OFF_WHITE,
      withoutEnlargement: true,
    })
    .flatten({ background: OFF_WHITE })
    .jpeg({ quality: 88 })
    .toBuffer();
}

/**
 * Removes the background from a garment photo, then frames the cut-out onto a
 * clean off-white studio backdrop (see frameToCard). Falls back to framing the
 * raw photo if segmentation fails (handled by the caller via frameGarmentImage).
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

  return frameToCard(cutout, { trimTransparent: true });
}

/** Fallback for when background removal fails — frame the raw photo as-is. */
export async function frameGarmentImage(buffer: Buffer): Promise<Buffer> {
  return frameToCard(buffer);
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}
