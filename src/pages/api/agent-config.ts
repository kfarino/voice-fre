import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/fQnuI7Y9aX2P6hawdTuY`, {
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ElevenLabs API Error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Failed to fetch agent configuration: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Agent configuration fetched:', data);

    // Return the full agent configuration
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching agent configuration:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch agent configuration'
    });
  }
} 