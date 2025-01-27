import type { NextConfig } from 'next';

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals.push({
      onnxruntime: 'onnxruntime',
      'onnxruntime-node': 'onnxruntime-node',
    });
    config.externals.push({ sharp: 'commonjs sharp' });
    return config;
  },
};

module.exports = nextConfig;
