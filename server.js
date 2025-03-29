require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/conversation-agents/fQnuI7Y9aX2P6hawdTuY/conversation-websocket';
const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_0213e01aa4619e94097f3d0e1cb17c190ca6296e6366e751';

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create WebSocket server attached to our HTTP server
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (clientWs) => {
    console.log('Client connected to local WebSocket server');

    let elevenlabsWs = null;
    try {
      // Connect to ElevenLabs WebSocket
      console.log('Connecting to ElevenLabs WebSocket...');
      elevenlabsWs = new WebSocket(ELEVENLABS_WS_URL, {
        headers: {
          'xi-api-key': API_KEY
        }
      });

      // Wait for ElevenLabs connection to be established
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        elevenlabsWs.onopen = () => {
          console.log('Connected to ElevenLabs WebSocket');
          clearTimeout(timeout);
          resolve();
        };

        elevenlabsWs.onerror = (error) => {
          console.error('ElevenLabs WebSocket connection error:', error);
          clearTimeout(timeout);
          reject(error);
        };
      });

      // Handle messages from client to ElevenLabs
      clientWs.on('message', (data) => {
        try {
          const message = data.toString();
          console.log('Received from client:', message);
          
          if (elevenlabsWs.readyState === WebSocket.OPEN) {
            console.log('Forwarding to ElevenLabs:', message);
            elevenlabsWs.send(message);
          } else {
            console.error('ElevenLabs WebSocket not open, state:', elevenlabsWs.readyState);
            clientWs.send(JSON.stringify({ 
              type: 'error', 
              data: { message: 'ElevenLabs connection not ready' }
            }));
          }
        } catch (err) {
          console.error('Error forwarding message to ElevenLabs:', err);
          clientWs.send(JSON.stringify({ 
            type: 'error',
            data: { message: 'Failed to forward message' }
          }));
        }
      });

      // Handle messages from ElevenLabs to client
      elevenlabsWs.on('message', (data) => {
        try {
          if (clientWs.readyState === WebSocket.OPEN) {
            if (data instanceof Buffer) {
              console.log('Forwarding binary data to client');
              clientWs.send(data);
            } else {
              const message = data.toString();
              console.log('Forwarding to client:', message);
              clientWs.send(message);
            }
          }
        } catch (err) {
          console.error('Error forwarding message to client:', err);
        }
      });

      // Handle ElevenLabs WebSocket closure
      elevenlabsWs.on('close', (code, reason) => {
        console.log('ElevenLabs WebSocket closed:', code, reason.toString());
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            data: { message: `ElevenLabs connection closed: ${code} ${reason}` }
          }));
          clientWs.close(code, 'ElevenLabs connection closed');
        }
      });

    } catch (err) {
      console.error('Error establishing ElevenLabs connection:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to connect to ElevenLabs: ' + err.message }
        }));
        clientWs.close(1011, 'Failed to establish ElevenLabs connection');
      }
    }

    // Handle client WebSocket closure
    clientWs.on('close', () => {
      console.log('Client WebSocket closed');
      if (elevenlabsWs && elevenlabsWs.readyState === WebSocket.OPEN) {
        elevenlabsWs.close();
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 