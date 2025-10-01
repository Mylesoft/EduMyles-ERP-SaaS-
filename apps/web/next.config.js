/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for better deployment
  output: 'standalone',
  
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 's3.amazonaws.com'],
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  
  // Transpile workspace packages
  transpilePackages: ['@edumyles/types'],
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;