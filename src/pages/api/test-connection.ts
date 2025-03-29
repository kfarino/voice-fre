import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // First test the API key with a simple voices endpoint
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return res.status(response.status).json({
        success: false,
        message: 'Failed to connect to ElevenLabs',
        error: errorData.detail || 'Unknown error',
        status: response.status,
        endpoint: 'voices'
      });
    }

    // If we have an agent ID, test that as well
    if (process.env.ELEVENLABS_AGENT_ID) {
      console.log('Testing agent connection with ID:', process.env.ELEVENLABS_AGENT_ID);
      
      // Try to list all agents first
      const listResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
        },
      });

      if (listResponse.ok) {
        const agents = await listResponse.json();
        console.log('Available agents:', agents);
      } else {
        console.log('Failed to list agents:', await listResponse.text());
      }

      // Get the specific agent details
      const agentUrl = `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`;
      console.log('Attempting to fetch agent from:', agentUrl);
      
      const agentResponse = await fetch(agentUrl, {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Accept': 'application/json',
        },
      });

      console.log('Agent response status:', agentResponse.status);
      console.log('Agent response headers:', Object.fromEntries(agentResponse.headers.entries()));

      if (!agentResponse.ok) {
        const errorText = await agentResponse.text();
        console.error('ElevenLabs Agent Error:', {
          status: agentResponse.status,
          statusText: agentResponse.statusText,
          error: errorText,
          agentId: process.env.ELEVENLABS_AGENT_ID,
          url: agentUrl
        });

        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText).detail;
        } catch {
          errorDetail = errorText;
        }

        return res.status(agentResponse.status).json({
          success: false,
          message: 'Connected to ElevenLabs but failed to verify agent',
          error: errorDetail,
          status: agentResponse.status,
          endpoint: 'convai/agents'
        });
      }

      const agentDetails = await agentResponse.json();
      console.log('Agent details:', agentDetails);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to ElevenLabs',
      agentId: process.env.ELEVENLABS_AGENT_ID,
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'Present' : 'Missing',
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 