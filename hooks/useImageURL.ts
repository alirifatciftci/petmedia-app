import { useState, useEffect } from 'react';

/**
 * Hook to handle image URLs for display
 * Supports data URLs (base64), http/https URLs
 *
 * Base64 data URLs are stored directly in Firestore - FREE and permanent!
 * file:// URLs are temporary and will NOT persist across app restarts.
 */
export function useImageURL(imageSource: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageSource) {
      setUrl(null);
      return;
    }

    // Data URLs (base64) - these are permanent and stored in Firestore
    if (imageSource.startsWith('data:image')) {
      setUrl(imageSource);
      return;
    }

    // Regular http/https URLs
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      setUrl(imageSource);
      return;
    }

    // file:// URLs - these are TEMPORARY and will break after app restart!
    if (imageSource.startsWith('file://')) {
      console.warn('⚠️ useImageURL: file:// URL detected - this is temporary!');
      console.warn('⚠️ useImageURL: Please re-upload this image to convert to base64.');
      // Still try to show it, but it may not work
      setUrl(imageSource);
      return;
    }

    // Assume it's raw base64 and convert to data URL
    try {
      const imageURL = `data:image/jpeg;base64,${imageSource}`;
      setUrl(imageURL);
    } catch (error) {
      console.error('useImageURL: Error processing image source:', error);
      setUrl(null);
    }
  }, [imageSource]);

  return url;
}

/**
 * Check if an image URL is a permanent base64 data URL or web URL
 */
export function isPermanentURL(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith('data:image') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  );
}

/**
 * Check if an image URL is a temporary local file URL
 */
export function isTemporaryURL(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('file://');
}
