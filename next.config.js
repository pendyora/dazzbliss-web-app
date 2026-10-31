/**
 * Remote image hosts allowed for next/image, comma-separated in NEXT_IMAGE_HOSTS (e.g. the backend's CloudFront domain).
 * DAZZBLISS TODO: set NEXT_IMAGE_HOSTS to the Dazzbliss image CDN host(s). The previous company's hosts were removed.
 */
const imageHosts = (process.env.NEXT_IMAGE_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https', hostname, pathname: '/**' })),
  },

  crossOrigin: 'anonymous',
  compress: process.env.NODE_ENV === 'production',

  devIndicators: {
    autoPrerender: false,
  },
  // reactStrictMode: process.env.NODE_ENV !== 'production',
  reactStrictMode: false,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
