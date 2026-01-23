import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // API rewrites to proxy to backend server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

