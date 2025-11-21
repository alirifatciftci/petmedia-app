import { useState, useEffect } from 'react';

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

    // If it's already a URL (http/https/file), use it directly
    if (base64String.startsWith('http://') || 
        base64String.startsWith('https://') || 
        base64String.startsWith('file://') ||
        base64String.startsWith('data:')) {
      setUrl(base64String);
      return;
    }

    // Convert base64 to data URL synchronously
    try {
      console.log('useImageURL: Converting base64 to URL, length:', base64String.length);
      // Check if it's already a data URL
      if (base64String.startsWith('data:')) {
        setUrl(base64String);
      } else {
        // Assume it's base64 and convert to data URL
        const imageURL = `data:image/jpeg;base64,${base64String}`;
        console.log('useImageURL: URL created, length:', imageURL.length);
        setUrl(imageURL);
      }
    } catch (error) {
      console.error('useImageURL: Error getting image URL:', error);
      setUrl(null);
    }
  }, [base64String]);

  return url;
}

