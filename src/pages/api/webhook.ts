import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { ServerResponse } from 'http';

declare global {
  var clients: ServerResponse[];
}

// Function to verify the webhook signature
const verifySignature = (payload: string, signature: string, secret: string) => {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['elevenlabs-signature'];
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    // Verify webhook signature
    if (!signature || !webhookSecret || !verifySignature(rawBody, signature as string, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const data = req.body;
    console.log('Webhook received:', data);

    // Handle different types of webhook events
    if (data.type === 'variable_collected') {
      const { name, value } = data.variable;
      console.log(`Variable collected - ${name}: ${value}`);

      // Broadcast the event to connected clients via SSE
      const clients = global.clients || [];
      const eventData = JSON.stringify({
        type: 'variable_collected',
        variable: { name, value }
      });

      clients.forEach(client => {
        client.write(`data: ${eventData}\n\n`);
      });
    }

    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 