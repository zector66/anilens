const ALLOWED_HOSTS = [
  's4.anilist.co',
  's1.anilist.co',
  's2.anilist.co',
  's3.anilist.co',
  'img.anili.st',
  'img1.ak.crunchyroll.com',
];

// Image size suffixes for AniList CDN
const IMAGE_QUALITY_SUFFIXES: Record<string, string> = {
  high: 'large',    // Full size
  medium: 'medium', // Medium size
  low: 'small',     // Small/thumbnail size
};

/**
 * Modify image URL to request appropriate size based on quality setting.
 * AniList images support different sizes via URL suffix.
 */
function applyImageQuality(url: string, quality: 'high' | 'medium' | 'low'): string {
  // Only modify AniList CDN URLs
  if (!url.includes('anilist.co/file/anilist/')) {
    return url;
  }

  const suffix = IMAGE_QUALITY_SUFFIXES[quality] || 'large';

  // AniList URLs typically end with the image name - replace size suffix
  // Pattern: .../cover/large.jpg -> .../cover/small.jpg
  return url.replace(/\/(large|medium)\./, `/${suffix}.`);
}

/**
 * Proxies an external image URL through our own API to avoid CORS/CORP issues.
 * Only allows known anime image CDN hosts for security.
 * Optionally applies image quality transformation for AniList CDN images.
 */
export function proxyImage(url: string, quality: 'high' | 'medium' | 'low' = 'high'): string {
  if (!url) return '';

  // Apply quality transformation for AniList images
  const transformedUrl = applyImageQuality(url, quality);

  // Already proxied or local
  if (transformedUrl.startsWith('/api/proxy-image') || transformedUrl.startsWith('/')) {
    return transformedUrl;
  }

  try {
    const parsed = new URL(transformedUrl);
    if (ALLOWED_HOSTS.includes(parsed.hostname)) {
      return `/api/proxy-image?url=${encodeURIComponent(transformedUrl)}`;
    }
  } catch {
    // Invalid URL, return as-is
  }

  return transformedUrl;
}
