import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Only use standalone for Docker/self-hosted deployments
  // For Vercel, leave it commented out so Vercel handles static files natively
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
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
  webpack: (config, { isServer }) => {
    // Exclude large dependencies from serverless function bundles
    if (isServer) {
      // Ensure Monaco Editor and WebContainer are not bundled in serverless functions
      // These are client-only and should be loaded dynamically
      config.resolve.alias = {
        ...config.resolve.alias,
        '@monaco-editor/react': false,
        '@webcontainer/api': false,
        'monaco-editor': false,
      };
    }

    return config;
  },
};

export default nextConfig;
