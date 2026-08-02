import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AVATAR_PUBLIC_MARKER = '/storage/v1/object/public/avatars/';
const AVATAR_SIGNED_MARKER = '/storage/v1/object/sign/avatars/';

function getAvatarPath(value: string): string | null {
  if (!value) return null;
  if (!value.includes('://')) return value.replace(/^avatars\//, '');

  const marker = value.includes(AVATAR_PUBLIC_MARKER)
    ? AVATAR_PUBLIC_MARKER
    : value.includes(AVATAR_SIGNED_MARKER)
      ? AVATAR_SIGNED_MARKER
      : null;
  if (!marker) return null;

  const encodedPath = value.split(marker)[1]?.split('?')[0];
  if (!encodedPath) return null;
  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}

/** Resolve avatares do bucket privado sem expor o arquivo publicamente. */
export function useAvatarUrl(storedValue?: string | null): string | null {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!storedValue) {
      setResolvedUrl(null);
      return () => { active = false; };
    }

    const path = getAvatarPath(storedValue);
    if (!path) {
      setResolvedUrl(storedValue);
      return () => { active = false; };
    }

    void supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data, error }) => {
        if (active) setResolvedUrl(error ? null : data.signedUrl);
      });

    return () => { active = false; };
  }, [storedValue]);

  return resolvedUrl;
}