/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables `output: standalone` for production Docker images.
  // This produces a minimal self-contained bundle in .next/standalone.
  output: 'standalone',

  // Allow images from external fashion photo sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'live.staticflickr.com' },
    ],
  },
};

export default nextConfig;
