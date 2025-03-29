import { useState } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      setError('');
      
      const response = await fetch('/api/test-connection');
      const data = await response.json();

      if (data.success) {
        setStatus(`Success! ${data.message}`);
      } else {
        setError(`Error: ${data.message} - ${data.error}`);
      }
    } catch (err) {
      setError(`Failed to test connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">ElevenLabs Connection Test</h1>
        
        <button
          onClick={testConnection}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Test Connection
        </button>

        {status && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded">
            {status}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 