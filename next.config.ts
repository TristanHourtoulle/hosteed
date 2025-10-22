import type { NextConfig } from 'next'

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable compression for better performance
  compress: true,

  // Performance optimizations
  poweredByHeader: false,

  // Redirects removed - homepage now shows proper landing page
  // Users can access /host directly for search/listings

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/images/:path*',
      },
    ]
  },

  // Enhanced image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'], // Add AVIF for better compression
    minimumCacheTTL: 86400,
    unoptimized: false,
  },

  // Experimental features for performance
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-icons'],
  },

  // External packages for server components
  serverExternalPackages: ['prisma'],

  // Webpack optimization for production
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Optimize chunk splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          // Separate heavy libraries
          editor: {
            test: /[\\/]node_modules[\\/](@uiw|react-md-editor)/,
            name: 'editor',
            priority: 20,
            reuseExistingChunk: true,
          },
          icons: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'icons',
            priority: 15,
            reuseExistingChunk: true,
          },
        },
      }

      // Add performance budgets
      config.performance = {
        maxAssetSize: 100000, // 100KB
        maxEntrypointSize: 250000, // 250KB
        hints: 'warning',
      }
    }

    return config
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
