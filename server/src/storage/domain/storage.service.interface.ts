export const STORAGE_SERVICE_TOKEN = 'IStorageService';

export interface UploadFileOptions {
  buffer: Buffer;
  filename: string;
  bucket: string;
  mimeType?: string;
}

export interface UploadFileResult {
  success: boolean;
  /** Supabase storage path inside the bucket, e.g. "ORD-001-signature.png" */
  path?: string;
  /** Full public URL for direct use in <img src="..."> */
  url?: string;
  error?: string;
}

export interface IStorageService {
  upload(options: UploadFileOptions): Promise<UploadFileResult>;
  /** Generates a time-limited signed URL (for private buckets, not used currently) */
  getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds?: number,
  ): Promise<string | null>;
}
