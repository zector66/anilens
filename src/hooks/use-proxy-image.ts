'use client';

import { useSettings } from '@/contexts/settings-context';
import { proxyImage as baseProxyImage } from '@/lib/image-proxy';
import { useCallback } from 'react';

/**
 * Hook that provides image proxying with user's preferred image quality setting.
 */
export function useProxyImage() {
  const { imageQuality } = useSettings();

  const proxyImage = useCallback(
    (url: string) => baseProxyImage(url, imageQuality),
    [imageQuality]
  );

  return proxyImage;
}
