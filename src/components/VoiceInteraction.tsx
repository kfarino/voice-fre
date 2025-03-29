import React, { useEffect, useRef } from 'react';

interface VoiceInteractionProps {
  onResponse: (response: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  onResponse,
  isListening,
  setIsListening
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isListening) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isListening]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioWithElevenLabs(audioBlob);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudioWithElevenLabs = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/process-voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process audio');
      }

      const data = await response.json();
      onResponse(data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={() => setIsListening(!isListening)}
        className={`px-6 py-3 rounded-full text-white font-semibold transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isListening ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}; 