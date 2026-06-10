/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use SWC for faster compilation & minification
  swcMinify: true,

  // Reduces unnecessary double-renders in dev mode
  reactStrictMode: false,

  // Optimize image handling
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Exclude server-side code from Next.js compilation entirely
  // This prevents Next.js from scanning Express controllers/routes/services
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve server-only modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'node-cron': false,
        serialport: false,
        pdfkit: false,
        winston: false,
      };
    }

    // Ignore server-side source files from Next.js bundling
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/src/controllers/**',
        '**/src/routes/**',
        '**/src/middleware/**',
        '**/src/config/**',
        '**/src/services/**',
        '**/src/server.ts',
        '**/dist/**',
        '**/logs/**',
        '**/.next/**',
      ],
    };

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
