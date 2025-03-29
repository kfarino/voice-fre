const WebSocket = require('ws');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

dotenv.config();

// Updated WebSocket URL to include agent ID in the path
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
const ELEVEN_WS = `wss://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}/conversation`;

if (!API_KEY || !AGENT_ID) {
  console.error('Missing NEXT_PUBLIC_ELEVENLABS_API_KEY or NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env');
  process.exit(1);
}

// Test HTTPS connectivity to ElevenLabs first
console.log('Testing HTTPS connectivity to ElevenLabs...');
https.get('https://api.elevenlabs.io/v1/models', {
  headers: {
    'xi-api-key': API_KEY,
    'User-Agent': 'WebSocket-Client'
  }
}, (res) => {
  console.log('HTTPS Test Results:');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('HTTPS connection test completed successfully');
    startWebSocketServer();
  });
}).on('error', (err) => {
  console.error('HTTPS connection test failed:', err);
  process.exit(1);
});

function startWebSocketServer() {
  const wss = new WebSocket.Server({ 
    port: 3001,
    path: '/elevenlabs'
  });

  console.log('WebSocket server created with path /elevenlabs');

  wss.on('connection', async (clientSocket, request) => {
    console.log('[Proxy] Frontend connected');
    console.log('[Proxy] Client IP:', request.socket.remoteAddress);

    const sessionId = `session_${uuidv4()}`;
    let elevenSocket = null;

    try {
      console.log('[Proxy] Attempting to connect to ElevenLabs...');
      console.log('[Proxy] Using WebSocket URL:', ELEVEN_WS);
      
      // Updated headers and connection options
      elevenSocket = new WebSocket(ELEVEN_WS, {
        headers: {
          'xi-api-key': API_KEY,
          'User-Agent': 'WebSocket-Client'
        },
        handshakeTimeout: 10000,
        followRedirects: true
      });

      console.log('[Proxy] Initial WebSocket state:', elevenSocket.readyState);
      
      await Promise.race([
        new Promise((resolve, reject) => {
          elevenSocket.onopen = () => {
            console.log('[Proxy] ElevenLabs WebSocket opened successfully');
            resolve();
          };
          
          elevenSocket.onerror = (error) => {
            console.error('[Proxy] WebSocket error during connection:', {
              error,
              readyState: elevenSocket.readyState,
              url: ELEVEN_WS
            });
            reject(new Error('WebSocket error during connection'));
          };
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            console.log('[Proxy] Connection state at timeout:', elevenSocket.readyState);
            reject(new Error('Connection timeout after 10s'));
          }, 10000)
        )
      ]);

      console.log('[Proxy] Successfully connected to ElevenLabs');

      // Send initial configuration
      const initialConfig = {
        session_id: sessionId,
        config: {
          audio_encoding: "LINEAR16",
          sample_rate: 16000,
          language: "en"
        }
      };

      console.log('[Proxy] Sending config to ElevenLabs:', initialConfig);
      elevenSocket.send(JSON.stringify(initialConfig));
      console.log('[Proxy] Config sent successfully');

      // Handle messages from ElevenLabs
      elevenSocket.on('message', (data) => {
        try {
          // Check if the data is binary (audio) or text (control messages)
          if (data instanceof Buffer) {
            console.log('[ElevenLabs] → Received audio data:', data.length, 'bytes');
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          } else {
            const message = JSON.parse(data.toString());
            console.log('[ElevenLabs] →', message);
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify(message));
            }
          }
        } catch (err) {
          console.error('[Error parsing ElevenLabs message]', err);
        }
      });

      // Handle messages from client
      clientSocket.on('message', (msg) => {
        if (elevenSocket.readyState === WebSocket.OPEN) {
          try {
            const message = JSON.parse(msg.toString());
            console.log('[Client] → Message:', message);
            elevenSocket.send(msg);
            console.log('[Client] → Message forwarded to ElevenLabs');
          } catch (err) {
            console.error('[Error sending message to ElevenLabs]', err);
          }
        } else {
          console.log('[Client] Message not forwarded, ElevenLabs connection state:', elevenSocket.readyState);
        }
      });

      // Handle client disconnect
      clientSocket.on('close', (code, reason) => {
        console.log('[Proxy] Frontend disconnected', { code, reason });
        if (elevenSocket) {
          elevenSocket.close();
        }
      });

      // Handle ElevenLabs errors
      elevenSocket.on('error', (error) => {
        console.error('[Proxy] ElevenLabs WS error:', {
          error,
          readyState: elevenSocket.readyState
        });
        clientSocket.close();
      });

      // Handle ElevenLabs disconnect
      elevenSocket.on('close', (code, reason) => {
        console.log('[Proxy] ElevenLabs closed:', {
          code,
          reason,
          readyState: elevenSocket.readyState
        });
        clientSocket.close();
      });

    } catch (error) {
      console.error('[Proxy] Failed to establish connection:', {
        error,
        socketState: elevenSocket ? elevenSocket.readyState : 'no socket'
      });
      clientSocket.close();
    }
  });

  wss.on('error', (error) => {
    console.error('[Server] WebSocket server error:', error);
  });

  console.log('✅ WebSocket proxy server running on ws://localhost:3001/elevenlabs');
} 