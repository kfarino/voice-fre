import React, { useState, useRef } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const connect = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('Already connected');
      return;
    }

    try {
      // Get API key
      const response = await fetch('/api/get-credentials');
      if (!response.ok) {
        throw new Error('Failed to get API credentials');
      }
      const { apiKey } = await response.json();

      addLog('Connecting to ElevenLabs...');
      setStatus('Connecting');

      // Connect directly to ElevenLabs
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?xi-api-key=${apiKey}`);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('✅ Connected');
        setStatus('Connected');

        // Send initial configuration
        const config = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: "You are a helpful assistant."
              },
              first_message: "Hello! How can I help you today?",
              language: "en"
            },
            tts: {
              voice_id: "21m00Tcm4TlvDq8ikWAM"
            }
          }
        };
        ws.send(JSON.stringify(config));
        addLog('📤 Sent initial configuration');
      };

      ws.onmessage = (event) => {
        addLog(`📥 Received: ${event.data}`);
        
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              event_id: message.ping_event.event_id
            }));
            addLog('📤 Sent pong response');
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        addLog(`❌ WebSocket error: ${error.type}`);
        setStatus('Error');
      };

      ws.onclose = () => {
        addLog('🔌 WebSocket closed');
        setStatus('Disconnected');
        wsRef.current = null;
      };

    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('Error');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setStatus('Disconnected');
      addLog('Disconnected');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ElevenLabs WebSocket Test</h1>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'Connected' ? 'bg-green-500' :
            status === 'Connecting' ? 'bg-yellow-500' :
            status === 'Error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="font-mono">{status}</span>
        </div>
        <div className="space-x-2">
          <button
            onClick={connect}
            disabled={status === 'Connected' || status === 'Connecting'}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={status === 'Disconnected'}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-auto">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">{log}</div>
        ))}
      </div>
    </div>
  );
}
