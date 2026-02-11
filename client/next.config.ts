import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.toss.im',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Prisma Client를 클라이언트 번들에서 완전히 제외
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': false,
      };
    }
    config.externals.push({
      onnxruntime: 'onnxruntime',
      'onnxruntime-node': 'onnxruntime-node',
    });
    if (!isServer) {
      config.externals.push('@prisma/client');
    }
    config.externals.push({ sharp: 'commonjs sharp' });
    return config;
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
