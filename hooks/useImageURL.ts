import { useState, useEffect } from 'react';
import { FirebaseStorage } from '../services/firebase';

/**
 * Hook to convert base64 string to data URL for display
 * Handles both base64 strings and URLs (backward compatibility)
 */
export function useImageURL(base64String: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!base64String) {
      console.log('useImageURL: No base64 string provided');
      setUrl(null);
      return;
    }

    // Convert base64 to data URL synchronously (no async needed)
    try {
      console.log('useImageURL: Converting base64 to URL, length:', base64String.length);
      const imageURL = FirebaseStorage.getImageURL(base64String);
      console.log('useImageURL: URL created, length:', imageURL.length);
      setUrl(imageURL);
    } catch (error) {
      console.error('useImageURL: Error getting image URL:', error);
      setUrl(null);
    }
  }, [base64String]);

  return url;
}

