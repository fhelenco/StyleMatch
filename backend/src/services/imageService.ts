import sharp from 'sharp';

export async function resizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}
