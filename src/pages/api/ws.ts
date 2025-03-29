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

  const upgradeHeader = req.headers.get('upgrade')?.toLowerCase()
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  try {
    const elevenlabsUrl = `wss://api.elevenlabs.io/v1/convai/agents/${agentId}/conversation`

    // Forward the WebSocket connection to ElevenLabs
    const response = await fetch(elevenlabsUrl, {
      method: 'GET',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': req.headers.get('sec-websocket-key') || '',
        'Sec-WebSocket-Version': req.headers.get('sec-websocket-version') || '',
        'Sec-WebSocket-Protocol': req.headers.get('sec-websocket-protocol') || '',
        'xi-api-key': apiKey
      }
    })

    // Forward the response headers from ElevenLabs
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Upgrade', 'websocket')
    responseHeaders.set('Connection', 'Upgrade')

    return new Response(null, {
      status: 101,
      headers: responseHeaders
    })
  } catch (err) {
    console.error('WebSocket setup error:', err)
    return new Response('Failed to establish WebSocket connection', { status: 500 })
  }
} 