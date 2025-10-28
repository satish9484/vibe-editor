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
    // Disable COOP/COEP headers for HTTP (localhost/hostname)
    // These headers are only needed for SharedArrayBuffer and are ignored on HTTP
    // They cause browser warnings when accessed via hostname or HTTP
    return [];
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
