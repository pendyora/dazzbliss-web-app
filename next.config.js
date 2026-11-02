/**
 * Remote image hosts allowed for next/image, comma-separated in NEXT_IMAGE_HOSTS. Each entry is either a
 * hostname (https, e.g. `images.dazzbliss.com`) or a full origin (e.g. `http://localhost:6300` for the backend's
 * local file storage while testing).
 * DAZZBLISS TODO: set NEXT_IMAGE_HOSTS to the Dazzbliss image CDN host(s). The previous company's hosts were removed.
 */
const imagePatterns = (process.env.NEXT_IMAGE_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)
  .map((entry) => {
    if (!entry.includes('://')) {
      return { protocol: 'https', hostname: entry, pathname: '/**' };
    }
    const url = new URL(entry);
    return { protocol: url.protocol.replace(':', ''), hostname: url.hostname, port: url.port, pathname: '/**' };
  });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imagePatterns,
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
