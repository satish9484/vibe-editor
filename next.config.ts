import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
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
    // Only apply COOP/COEP headers in HTTPS (production)
    // These headers are ignored on HTTP and cause browser warnings
    return process.env.NODE_ENV === 'production'
      ? [
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
        ]
      : [];
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  } as NextConfig['experimental'],

  // Copy environment files to standalone build
  outputFileTracingIncludes: {
    '/*': ['.env.local', '.env'],
  },
};

export default nextConfig;
