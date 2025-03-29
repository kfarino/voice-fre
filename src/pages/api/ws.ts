import { type NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

  if (!agentId || !apiKey) {
    return new Response('Missing environment variables', { status: 500 })
  }

  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  try {
    const elevenlabsUrl = `wss://api.elevenlabs.io/v1/convai/agents/${agentId}/conversation`
    const elevenlabsRes = await fetch(elevenlabsUrl, {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'xi-api-key': apiKey,
      }
    })

    // Forward the WebSocket upgrade
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': req.headers.get('sec-websocket-key') || '',
      }
    })
  } catch (err) {
    console.error('WebSocket connection error:', err)
    return new Response('Failed to establish WebSocket connection', { status: 500 })
  }
} 