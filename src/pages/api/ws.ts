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

    // Get WebSocket-related headers
    const socketKey = req.headers.get('sec-websocket-key')
    const socketProtocol = req.headers.get('sec-websocket-protocol')
    const socketVersion = req.headers.get('sec-websocket-version')

    if (!socketKey || !socketVersion) {
      return new Response('Missing required WebSocket headers', { status: 400 })
    }

    // Create WebSocket handshake response headers
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
    const acceptKey = btoa(String.fromCharCode(...new Uint8Array(
      await crypto.subtle.digest('SHA-1', new TextEncoder().encode(socketKey + GUID))
    )))

    const headers = new Headers({
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': acceptKey,
    })

    if (socketProtocol) {
      headers.set('Sec-WebSocket-Protocol', socketProtocol)
    }

    // Create response with WebSocket upgrade
    return new Response(null, {
      status: 101,
      headers
    })
  } catch (err) {
    console.error('WebSocket setup error:', err)
    return new Response('Failed to establish WebSocket connection', { status: 500 })
  }
} 