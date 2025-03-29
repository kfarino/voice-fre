import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsThreeDots, BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { FaMicrophone, FaVolumeUp, FaMicrophoneSlash } from 'react-icons/fa';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface DataField {
  name: string;
  value: string | null;
  isComplete: boolean;
  confidence?: number;
  status?: string;
}

interface AgentState {
  isListening: boolean;
  isSpeaking: boolean;
  currentMessage: string;
}

interface SlotData {
  slot: string;
  value: string;
  confidence: number;
  status: string;
}

export const VoiceChat: React.FC = () => {
  console.log('Rendering VoiceChat component');

  const [dataFields, setDataFields] = useState<DataField[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  
  const [agentState, setAgentState] = useState<AgentState>({
    isListening: false,
    isSpeaking: false,
    currentMessage: "Loading..."
  });

  const [error, setError] = useState<string | null>(null);

  const updateDataField = (slotData: SlotData) => {
    console.log(`Updating field from slot data:`, slotData);
    setDataFields(prev => {
      const fieldExists = prev.some(field => field.name === slotData.slot);
      if (!fieldExists) {
        return [...prev, {
          name: slotData.slot,
          value: slotData.value,
          isComplete: slotData.status === 'filled',
          confidence: slotData.confidence
        }];
      }
      return prev.map(field => 
        field.name === slotData.slot 
          ? { 
              ...field, 
              value: slotData.value, 
              isComplete: slotData.status === 'filled',
              confidence: slotData.confidence
            }
          : field
      );
    });
  };

  const startConversation = async () => {
    try {
      // Initialize WebSocket connection
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      
      console.log('Environment variables check:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        hasAgentId: !!agentId,
        agentIdLength: agentId?.length
      });
      
      if (!apiKey || !agentId) {
        const missingVars = [];
        if (!apiKey) missingVars.push('NEXT_PUBLIC_ELEVENLABS_API_KEY');
        if (!agentId) missingVars.push('NEXT_PUBLIC_ELEVENLABS_AGENT_ID');
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      console.log('Initializing WebSocket connection...');
      const protocols = [`xi-api-key.${apiKey}`];
      console.log('Using protocols:', protocols);
      
      const ws = new WebSocket(
        'wss://api.elevenlabs.io/v1/convai/conversation',
        protocols
      );
      websocketRef.current = ws;

      // Set up WebSocket event handlers
      ws.onopen = () => {
        console.log('WebSocket connection established');
        
        // Check if the connection is actually ready
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('WebSocket not in OPEN state:', ws.readyState);
          return;
        }

        console.log('Sending initial config...');
        // Send initial configuration exactly as documented
        const config = {
          agent_id: agentId,
          session_id: "session_xyz",
          config: {
            audio_encoding: "LINEAR16",
            sample_rate: 16000,
            language: "en"
          }
        };
        console.log('Initial config:', JSON.stringify(config, null, 2));
        
        try {
          ws.send(JSON.stringify(config));
          console.log('Initial config sent successfully');
        } catch (err) {
          console.error('Error sending initial config:', err);
          setError('Failed to send initial configuration');
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', {
            type: data.type,
            readyState: ws.readyState,
            data: JSON.stringify(data, null, 2)
          });

          if (data.type === 'error') {
            console.error('Agent error:', data.error);
            setError(`Agent error: ${data.error}`);
            return;
          }

          if (data.type === 'ready') {
            console.log('Connection ready, starting audio stream');
            if (ws.readyState === WebSocket.OPEN) {
              await startAudioStream();
            } else {
              console.error('Cannot start audio stream, WebSocket not open:', ws.readyState);
            }
            return;
          }

          if (data.type === 'speech' && data.text) {
            console.log('Received speech text:', data.text);
            setAgentState(prev => ({ ...prev, currentMessage: data.text }));
            return;
          }

          if (data.type === 'slot_data' && data.slot) {
            console.log('Received slot data:', data.slot);
            updateDataField(data.slot);
            return;
          }

          if (data.type === 'audio' && data.audio) {
            console.log('Received audio data');
            try {
              const audioBuffer = Buffer.from(data.audio, 'base64');
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              
              audioContext.decodeAudioData(audioBuffer.buffer, (decodedData) => {
                const source = audioContext.createBufferSource();
                source.buffer = decodedData;
                source.connect(audioContext.destination);
                
                source.onended = () => {
                  setAgentState(prev => ({ ...prev, isSpeaking: false }));
                  audioContext.close();
                };
                
                source.start(0);
                setAgentState(prev => ({ ...prev, isSpeaking: true }));
              });
            } catch (audioErr) {
              console.error('Error processing audio:', audioErr);
            }
            return;
          }

          console.log('Unhandled message type:', data.type);
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', {
          error,
          readyState: ws.readyState,
          bufferedAmount: ws.bufferedAmount
        });
        setError('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: ws.readyState
        });
        stopAudioStream();
        setIsActive(false);
        setAgentState(prev => ({ ...prev, isListening: false, isSpeaking: false }));
      };

      // Initialize audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      setIsActive(true);
      setAgentState(prev => ({ ...prev, isListening: true }));
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
    }
  };

  const startAudioStream = async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      if (!audioContextRef.current || !websocketRef.current) return;

      // Create audio source from microphone
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create script processor for audio processing
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      // Process audio data
      processor.onaudioprocess = (e) => {
        const ws = websocketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket not ready for audio:', ws?.readyState);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert float32 to int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64 and send in correct format
        try {
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
          const audioMessage = {
            audio: {
              chunk: base64Audio
            }
          };
          ws.send(JSON.stringify(audioMessage));
        } catch (err) {
          console.error('Error sending audio data:', err);
        }
      };

      // Connect the audio nodes
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error('Error starting audio stream:', err);
      setError('Failed to access microphone');
    }
  };

  const stopAudioStream = () => {
    // Stop audio processing
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopConversation = () => {
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    stopAudioStream();
    setIsActive(false);
    setAgentState(prev => ({ ...prev, isListening: false, isSpeaking: false }));
  };

  useEffect(() => {
    // Fetch agent configuration to get data collection fields
    const fetchAgentConfig = async () => {
      try {
        console.log('Fetching agent configuration...');
        setIsLoading(true);
        const response = await fetch('/api/agent-config');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch agent configuration: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Agent configuration received:', data);
        
        if (!data) {
          throw new Error('No data received from agent configuration');
        }

        // Extract data collection fields from the configuration
        const dataCollection = data?.platform_settings?.data_collection;
        if (!dataCollection) {
          console.warn('No data collection fields found in agent configuration');
          setDataFields([]);
        } else {
          console.log('Data collection fields:', dataCollection);
          
          // Convert the data collection object into an array of fields
          const fields = Object.entries(dataCollection).map(([name, config]) => ({
            name,
            value: null,
            isComplete: false
          }));
          
          console.log('Processed fields:', fields);
          setDataFields(fields);
        }
        
        // Set initial message from agent configuration
        const firstMessage = data?.conversation_config?.agent?.first_message || "Hi, I'm here to help you get started!";
        console.log('Setting initial message:', firstMessage);
        
        setAgentState(prev => ({
          ...prev,
          currentMessage: firstMessage
        }));

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching agent config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agent configuration');
        setIsLoading(false);
      }
    };

    fetchAgentConfig();

    // Cleanup function
    return () => {
      stopConversation();
    };
  }, []);

  const completedFields = dataFields.filter(field => field.isComplete).length;
  const totalFields = dataFields.length;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  console.log('Current state:', {
    isLoading,
    error,
    dataFields,
    agentState
  });

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-8 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center max-w-lg">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering main UI');
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Interactive Onboarding
          </h1>
          <p className="text-gray-400">Voice-powered by ElevenLabs AI</p>
        </header>

        {/* Voice Control */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <button
            onClick={isActive ? stopConversation : startConversation}
            className={`p-6 rounded-full transition-all duration-200 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isActive ? (
              <FaMicrophoneSlash className="w-8 h-8" />
            ) : (
              <FaMicrophone className="w-8 h-8" />
            )}
          </button>
          <p className="mt-2 text-sm text-gray-400">
            {isActive ? 'Tap to end conversation' : 'Tap to start conversation'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{completedFields} of {totalFields} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Agent Status */}
        <div className="bg-gray-800/50 rounded-2xl p-8 mb-8 backdrop-blur-lg border border-gray-700">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <AnimatePresence mode="wait">
              {agentState.isListening && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center text-blue-400"
                >
                  <FaMicrophone className="w-6 h-6 mr-2" />
                  <span>Listening...</span>
                </motion.div>
              )}
              {agentState.isSpeaking && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center text-green-400"
                >
                  <FaVolumeUp className="w-6 h-6 mr-2" />
                  <span>Speaking...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-center text-lg text-blue-300">{agentState.currentMessage}</p>
        </div>

        {/* Data Collection Progress */}
        {dataFields.length > 0 && (
          <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">Data Collection Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataFields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    field.isComplete 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{field.name}</span>
                    {field.isComplete ? (
                      <BsCheckCircleFill className="w-5 h-5 text-green-500" />
                    ) : (
                      <BsCircle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  {field.value && (
                    <div className="mt-1">
                      <p className="text-sm text-gray-400">{field.value}</p>
                      {field.confidence && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {Math.round(field.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 