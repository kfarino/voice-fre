import { NextApiRequest, NextApiResponse } from 'next';

declare global {
  var clients: NextApiResponse[];
}

if (!global.clients) {
  global.clients = [];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add this client to our list
    global.clients.push(res);

    // Remove client when they disconnect
    req.on('close', () => {
      const index = global.clients.indexOf(res);
      if (index !== -1) {
        global.clients.splice(index, 1);
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 