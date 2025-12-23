import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !REGION || !BUCKET) {
  throw new Error('Missing AWS S3 environment variables');
}

export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3Client.send(command);
  if (!response.Body) throw new Error('No S3 object body');
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function getSignedUrlForKey(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
}
