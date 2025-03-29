import { NextRequest } from 'next/server';

const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/conversation-agents/fQnuI7Y9aX2P6hawdTuY/conversation-websocket';

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East (N. Virginia)
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey') || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return new Response('API key is required', { status: 401 });
  }

  const upgradeHeader = req.headers.get('upgrade');
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 426 });
  }

  try {
    const { 0: client, 1: server } = new WebSocketPair();

    // Connect to ElevenLabs
    const elevenlabsWs = new WebSocket(ELEVENLABS_WS_URL, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    // Forward messages from client to ElevenLabs
    client.addEventListener('message', (event) => {
      if (elevenlabsWs.readyState === WebSocket.OPEN) {
        console.log('Forwarding to ElevenLabs:', event.data);
        elevenlabsWs.send(event.data);
      }
    });

    // Forward messages from ElevenLabs to client
    elevenlabsWs.addEventListener('message', (event) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Forwarding to client:', event.data);
        client.send(event.data);
      }
    });

    // Handle client disconnect
    client.addEventListener('close', () => {
      console.log('Client disconnected');
      if (elevenlabsWs.readyState === WebSocket.OPEN) {
        elevenlabsWs.close();
      }
    });

    // Handle ElevenLabs disconnect
    elevenlabsWs.addEventListener('close', (event) => {
      console.log('ElevenLabs disconnected:', event.code, event.reason);
      if (client.readyState === WebSocket.OPEN) {
        client.close(event.code, event.reason);
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: server,
    });
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response(
      `Failed to set up WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
} 