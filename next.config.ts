import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's1.anilist.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2.anilist.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.anilist.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.anili.st',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'animethemes.moe',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v.animethemes.moe',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img1.ak.crunchyroll.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Aggressive caching to minimize image optimization usage
    minimumCacheTTL: 31536000, // 1 year - cache images for a very long time
    deviceSizes: [640, 750, 828, 1080, 1200], // Fewer device sizes = fewer optimizations
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Fewer image sizes = fewer optimizations
    formats: ['image/webp'], // Only WebP to reduce variants
  },
};

export default nextConfig;
