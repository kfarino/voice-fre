/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'voice-fre.vercel.app'],
    },
  },
  // Ensure proper handling of environment variables
  env: {
    NEXT_PUBLIC_ELEVENLABS_API_KEY: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
  },
  // Optimize for production
  swcMinify: true,
  // Ensure proper image optimization
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig; 