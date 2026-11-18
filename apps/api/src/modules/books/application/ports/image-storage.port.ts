export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMimeType = (typeof ALLOWED_IMAGE_TYPES)[number];

export interface ImageUpload {
  readonly buffer: Buffer;
  readonly mimeType: ImageMimeType;
}

/** Storage port: local disk today, S3/GCS tomorrow without touching use cases. */
export abstract class ImageStorage {
  /** Persists the image and returns its public URL. */
  abstract save(image: ImageUpload): Promise<string>;

  abstract remove(url: string): Promise<void>;
}
