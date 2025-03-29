import { NextApiRequest, NextApiResponse } from 'next';

// Initialize global clients array if it doesn't exist
if (!global.clients) {
  global.clients = [];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this client to the clients list
  global.clients.push(res);

  // Send initial connection established message
  res.write('data: {"type":"connected"}\n\n');

  // Keep the connection alive
  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  // Clean up on close
  req.on('close', () => {
    clearInterval(keepAlive);
    global.clients = global.clients.filter(client => client !== res);
    res.end();
  });
} 