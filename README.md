# Voice FRE (First Run Experience)

A Next.js application that uses ElevenLabs' voice AI to guide users through account creation and health condition collection.

## Features

- Voice-guided user interface
- Interactive account creation flow
- Health conditions management
- Real-time voice conversation with AI agent
- Responsive tablet-optimized design

## Tech Stack

- Next.js 15.2.4
- React 19
- ElevenLabs Voice AI (@11labs/react)
- TailwindCSS
- TypeScript

## Prerequisites

- Node.js 18+ 
- pnpm
- ElevenLabs API Key
- ElevenLabs Agent ID

## Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

This project is optimized for deployment on Vercel. Configure the following environment variables in your Vercel project settings:

- `NEXT_PUBLIC_ELEVENLABS_API_KEY`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

## License

MIT
