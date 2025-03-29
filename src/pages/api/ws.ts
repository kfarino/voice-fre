import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey') || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return new Response('API key is required', { status: 401 });
  }

  try {
    // Connect directly to ElevenLabs WebSocket
    const url = `wss://api.elevenlabs.io/v1/convai/conversation?xi-api-key=${apiKey}`;
    
    // Return upgrade response with headers
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': req.headers.get('sec-websocket-key') || '',
        'Sec-WebSocket-Protocol': 'websocket'
      }
    });
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response(
      `Failed to set up WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
} 