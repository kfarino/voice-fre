import React from 'react';

interface OnboardingUIProps {
  currentStep: string;
  message: string;
  userResponses: Record<string, string>;
  isListening: boolean;
}

export const OnboardingUI: React.FC<OnboardingUIProps> = ({
  currentStep,
  message,
  userResponses,
  isListening
}) => {
  return (
    <div className="space-y-6">
      {/* Current Message */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800">{message}</p>
      </div>

      {/* User Responses */}
      <div className="space-y-4">
        {Object.entries(userResponses).map(([step, response]) => (
          <div key={step} className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">
              <span className="font-semibold">Your response:</span> {response}
            </p>
          </div>
        ))}
      </div>

      {/* Recording Status */}
      {isListening && (
        <div className="flex items-center justify-center space-x-2 text-red-500">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
}; 