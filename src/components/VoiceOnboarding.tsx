import React, { useState, useEffect } from 'react';
import { VoiceInteraction } from './VoiceInteraction';
import { OnboardingUI } from './OnboardingUI';

interface OnboardingStep {
  id: string;
  message: string;
  expectedResponse?: string;
  nextStep?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    message: 'Welcome to our onboarding experience! I\'m here to help you get started. Would you like to begin?',
    expectedResponse: 'yes',
    nextStep: 'name'
  },
  {
    id: 'name',
    message: 'Great! What\'s your name?',
    nextStep: 'preferences'
  },
  {
    id: 'preferences',
    message: 'Nice to meet you! What brings you here today?',
    nextStep: 'features'
  },
  {
    id: 'features',
    message: 'I\'d love to show you some key features. Which one interests you most: customization, automation, or analytics?',
    nextStep: 'demo'
  }
];

export const VoiceOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState<boolean>(false);

  const handleVoiceResponse = (response: string) => {
    setUserResponses(prev => ({
      ...prev,
      [currentStep]: response
    }));

    const currentStepData = onboardingSteps.find(step => step.id === currentStep);
    if (currentStepData?.nextStep) {
      setCurrentStep(currentStepData.nextStep);
    }
  };

  const getCurrentStepMessage = () => {
    const step = onboardingSteps.find(s => s.id === currentStep);
    return step?.message || '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Voice Interactive Onboarding</h1>
        
        <OnboardingUI
          currentStep={currentStep}
          message={getCurrentStepMessage()}
          userResponses={userResponses}
          isListening={isListening}
        />

        <VoiceInteraction
          onResponse={handleVoiceResponse}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      </div>
    </div>
  );
}; 