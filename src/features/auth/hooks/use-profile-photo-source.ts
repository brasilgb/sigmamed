import { useEffect, useState } from 'react';

export function useProfilePhotoSource(photoUri: string | null | undefined) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(photoUri ?? null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);

    if (!photoUri) {
      setResolvedUri(null);
      return;
    }

    setResolvedUri(photoUri);
  }, [photoUri]);

  return {
    hasError,
    onError: () => setHasError(true),
    uri: hasError ? null : resolvedUri,
  };
}
