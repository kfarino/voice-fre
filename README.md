# ElevenLabs Voice Chat

A Next.js application that demonstrates real-time voice chat using ElevenLabs' WebSocket API.

## Features

- Real-time voice interaction with ElevenLabs AI
- WebSocket-based communication
- Audio streaming and playback
- Status monitoring and debug logging

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your ElevenLabs API key:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: The ID of your ElevenLabs agent

## Development

The application uses:
- Next.js for the framework
- WebSocket for real-time communication
- Web Audio API for audio handling

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
