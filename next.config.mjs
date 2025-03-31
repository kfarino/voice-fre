/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'voice-fre.vercel.app'],
    },
  },
};

export default nextConfig; 