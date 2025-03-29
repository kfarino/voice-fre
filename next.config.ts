import { NextConfig } from 'next';

const config: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: '/api/ws'
      }
    ];
  }
};

export default config;
