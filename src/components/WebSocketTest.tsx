import React, { useState, useRef, useEffect } from 'react';

export default function WebSocketTest() {
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const connect = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('Already connected');
      return;
    }

    addLog('Connecting to WebSocket...');
    setStatus('Connecting');
    
    try {
      // Connect to our Edge Function WebSocket endpoint
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/api/ws`);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          addLog('❌ Connection timeout');
          setStatus('Error');
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        addLog('✅ Connected');
        setStatus('Connected');

        // Initialize AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({
            sampleRate: 16000
          });
        }

        // Send initial configuration
        const config = {
          session_id: `session_${Date.now()}`,
          config: {
            audio_encoding: "LINEAR16",
            sample_rate: 16000,
            language: "en"
          }
        };
        ws.send(JSON.stringify(config));
        addLog('📤 Sent initial configuration');

        // Send test message to start conversation
        const startMessage = {
          text: "Hello, how are you?",
          type: "text"
        };
        ws.send(JSON.stringify(startMessage));
        addLog('📤 Sent initial message');
      };

      wsRef.current = ws;

      ws.onmessage = async (event: MessageEvent) => {
        try {
          addLog(`📥 Raw message received`);
          
          if (event.data instanceof Blob) {
            // Handle audio data
            const arrayBuffer = await event.data.arrayBuffer();
            const audioBuffer = await audioContextRef.current?.decodeAudioData(arrayBuffer);
            
            if (audioBuffer && audioContextRef.current) {
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current.destination);
              source.start(0);
              addLog('🔊 Playing received audio');
            }
          } else {
            // Handle control messages
            const message = JSON.parse(event.data);
            addLog(`📥 Parsed message: ${JSON.stringify(message, null, 2)}`);

            // Handle ping messages
            if (message.type === 'ping') {
              const pong = {
                type: 'pong',
                event_id: message.ping_event.event_id
              };
              ws.send(JSON.stringify(pong));
              addLog('📤 Sent pong response');
            }
          }
        } catch (err) {
          addLog(`❌ Error handling message: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      };

      ws.onerror = (error: Event) => {
        clearTimeout(connectionTimeout);
        addLog(`❌ WebSocket error: ${error.type}`);
        setStatus('Error');
      };

      ws.onclose = (event: CloseEvent) => {
        clearTimeout(connectionTimeout);
        addLog(`🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason || 'none'}`);
        setStatus('Disconnected');
        wsRef.current = null;

        // Attempt to reconnect if not manually disconnected
        if (event.code === 1006) {
          addLog('Attempting to reconnect in 3 seconds...');
          setTimeout(connect, 3000);
        }
      };

    } catch (err) {
      addLog(`❌ Error creating WebSocket: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('Error');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      addLog('Closing connection...');
      wsRef.current.close();
      wsRef.current = null;
      setStatus('Disconnected');
      addLog('Disconnected');
    }
  };

  const sendTestAudio = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('❌ WebSocket not connected');
      return;
    }

    try {
      // Create 1 second of silence as test audio
      const sampleRate = 16000;
      const audioData = new Float32Array(sampleRate); // 1 second of silence
      
      // Convert to Int16Array for LINEAR16 format
      const int16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        int16Data[i] = audioData[i] * 32767;
      }

      // Send the audio data directly as a binary message
      wsRef.current.send(int16Data.buffer);
      addLog('📤 Sent test audio data');
    } catch (err) {
      addLog(`❌ Error sending audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

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

      <div className="mb-4">
        <button
          onClick={sendTestAudio}
          disabled={status !== 'Connected'}
          className={`w-full px-4 py-2 rounded ${
            status === 'Connected'
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send Test Audio
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-auto">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">{log}</div>
        ))}
      </div>
    </div>
  );
} 