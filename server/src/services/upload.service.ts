import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import sharp from 'sharp';
import crypto from 'crypto';

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

export async function uploadResizedImage(buffer: Buffer, originalName: string): Promise<string> {
  // Compress and resize image using Sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const uniqueId = crypto.randomUUID();
  const fileKey = `uploads/${uniqueId}.webp`;

  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET,
    Key: fileKey,
    Body: optimizedBuffer,
    ContentType: 'image/webp',
    ACL: 'public-read', // Deprecated in some S3 setups, but standard placeholder
  });

  await s3Client.send(command);

  // Return the public URL
  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`;
}
