import { useEffect, useState } from 'react';
import apiService from '@/services/api';

/**
 * Check if a URL is a private S3 URL that needs a presigned URL to be viewable.
 */
const isS3Url = (url: string): boolean =>
  url.startsWith('s3://') || url.includes('.s3.') || url.includes('s3.amazonaws.com');

/**
 * Resolve a photo URL — if it's an S3 URL, fetch a presigned URL from the backend.
 * For local storage URLs, return as-is.
 */
export async function resolvePhotoUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!isS3Url(url)) return url;
  try {
    const { presigned_url } = await apiService.photos.getPresignedUrl(url);
    return presigned_url;
  } catch {
    return url;
  }
}

/**
 * React hook that resolves a photo URL to a displayable URL.
 * For S3 URLs, it fetches a presigned URL from the backend.
 * For local URLs, it returns the URL as-is.
 */
export function usePresignedUrl(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(url && !isS3Url(url) ? url : null);

  useEffect(() => {
    if (!url) {
      setResolved(null);
      return;
    }

    if (!isS3Url(url)) {
      setResolved(url);
      return;
    }

    let cancelled = false;
    resolvePhotoUrl(url).then((result) => {
      if (!cancelled) setResolved(result);
    });
    return () => { cancelled = true; };
  }, [url]);

  return resolved;
}
