import { NextApiRequest, NextApiResponse } from 'next';
import { WebSocket } from 'ws';

// This variable will store our connection to ElevenLabs
let elevenLabsWs: WebSocket | null = null;

if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY environment variable');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // WebSocket handling is now done in server.js
  res.status(200).json({ message: 'WebSocket endpoint active' });
} 