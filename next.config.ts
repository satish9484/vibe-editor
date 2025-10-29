import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable standalone for Vercel (Vercel handles static files natively)
  // Uncomment the line below for self-hosted deployments
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // Enable cross-origin isolation headers for WebContainer (SharedArrayBuffer)
    // Required for WebContainer API to work in production
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  } as NextConfig['experimental'],

  // Copy environment files to standalone build
  outputFileTracingIncludes: {
    '/': ['.env.local', '.env'],
  },
  // Copy public folder to standalone output
  outputFileTracingExcludes: {
    '/': ['node_modules/**/*'],
  },
};

export default nextConfig;
