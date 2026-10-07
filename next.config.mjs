/** @type {import('next').NextConfig} */
const nextConfig = {
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
