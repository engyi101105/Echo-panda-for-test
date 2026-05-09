import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = '6d32f697d11342632942848ecc14ff12';
const R2_ACCESS_KEY_ID = 'f30f560612e32635c5c67aca151bfc89';
const R2_SECRET_ACCESS_KEY = '0cc5b06d11bf1c23250ea2f4c7834f60926e6da18e8518724b220b5106c913c5';
const R2_BUCKET_NAME = 'echo-panda';
const R2_PUBLIC_URL = 'https://pub-381e81e2f32c46c0a03f33b821638811.r2.dev';

// R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize S3 Client for R2
export const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' for region
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to R2
 * @param file - File object or Buffer
 * @param key - File path/key in the bucket (e.g., 'images/album-cover.jpg')
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns Promise with the file URL
 */
export const uploadToR2 = async (
  file: File | Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  try {
    let body: Uint8Array | Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      body = new Uint8Array(arrayBuffer);
    } else {
      body = file;
    }

    // Use PutObjectCommand directly for browser compatibility
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
};

/**
 * Delete a file from R2
 * @param key - File path/key in the bucket
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw error;
  }
};

/**
 * Get a file from R2
 * @param key - File path/key in the bucket
 * @returns File buffer
 */
export const getFromR2 = async (key: string): Promise<Uint8Array> => {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    const stream = response.Body as any;
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    // Concatenate all chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  } catch (error) {
    console.error('Error getting from R2:', error);
    throw error;
  }
};

/**
 * Generate a unique file key with timestamp
 * @param originalName - Original file name
 * @param folder - Optional folder path (e.g., 'images', 'audio')
 * @returns Unique file key
 */
export const generateFileKey = (originalName: string, folder: string = ''): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (folder) {
    return `${folder}/${timestamp}-${randomString}-${sanitizedName}`;
  }
  
  return `${timestamp}-${randomString}-${sanitizedName}`;
};

export { R2_BUCKET_NAME, R2_ENDPOINT, R2_PUBLIC_URL };
