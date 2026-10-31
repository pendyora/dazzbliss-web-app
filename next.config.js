/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Define the protocol, hostname, and path pattern
        protocol: 'https',
        hostname: 'd2xnejqesyh20p.cloudfront.net',
        pathname: '/**', // Use `/**` to allow all paths
      },
      {
        // Define the protocol, hostname, and path pattern
        protocol: 'https',
        hostname: 'aws.kavyajewel.com',
        pathname: '/**', // Use `/**` to allow all paths
      },
    ],
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
