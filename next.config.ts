import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable standalone for Vercel (Vercel handles static files natively)
  // For self-hosted deployments, use: BUILD_STANDALONE=true npm run build
  // output: 'standalone', // Uncomment for standalone builds
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
    // Using credentialless COEP instead of require-corp to avoid breaking static assets
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
            value: 'credentialless',
          },
        ],
      },
      // Allow loading of public assets
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/:path*\\.(svg|png|jpg|jpeg|webp|ico)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
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
