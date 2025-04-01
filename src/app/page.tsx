"use client";

import { ConversationCard } from "@/components/conversation-card";
import { CallButton } from "@/components/call-button";
import { getAgentSignedUrl } from "./actions/actions";
import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConversationData {
  firstName?: string;
  lastName?: string;
  role?: "Primary User" | "Caregiver";
  dateOfBirth?: string;
  phone?: string;
  healthConditions?: { key: string; name: string }[];
  medications?: Array<{
    id: string;
    name?: string;
    strength?: string;
    form?: string;
    doses?: Array<{
      pillCount?: number;
      timeOfDay?: string;
      specificDays?: string[];
    }>;
    asNeeded: number;  // 0 if not as needed, otherwise max pills per day
  }>;
  showMedications?: boolean;
  currentMedicationId?: string;
}

// Helper functions
const formatDoseTime = (time: string): string => {
  if (!time) return '';
  
  // Remove all spaces and convert to uppercase
  let formattedTime = time.replace(/\s+/g, '').toUpperCase();
  
  // Ensure consistent format for single-digit hours (e.g., 8:00AM -> 08:00AM)
  const match = formattedTime.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (match) {
    const [_, hour, minute, period] = match;
    formattedTime = `${hour.padStart(2, '0')}:${minute}${period.toUpperCase()}`;
  }
  
  return formattedTime;
};

const arraysEqual = (a: string[], b: string[]): boolean => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  
  // Normalize and sort both arrays
  const normalizeAndSort = (arr: string[]) => 
    arr.map(s => s.trim().toUpperCase()).sort();
  
  const sortedA = normalizeAndSort(a);
  const sortedB = normalizeAndSort(b);
  
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

// Types for medication management
type DoseSchedule = {
  time: string;
  days: string[];
  pillCount: number;
};

type MedicationUpdate = {
  name: string;
  medicationKey: string;
  strength: string;
  form: string;
  doses: DoseSchedule[];
  asNeeded?: number;
};

type FlatMedicationUpdate = {
  medicationKey: string;    // Unique identifier (e.g., "metformin_500mg")
  name: string;            // Medication name (e.g., "Metformin")
  strength: string;        // Strength with unit (e.g., "500mg")
  form: string;           // Form (e.g., "Tablet", "Capsule")
  times: string[];        // Array of times (e.g., ["8:00AM", "8:00PM"])
  days: string[];         // Array of days (e.g., ["M", "T", "W", "Th", "F", "S", "Su"])
  pillCounts: number[];   // Array of pill counts matching times array
  asNeeded?: number;      // Optional: pills allowed as needed
};

export default function Home() {
  const conversation = useConversation();
  const [isCollecting, setIsCollecting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userData, setUserData] = useState<ConversationData>({});
  const [hasAudioAccess, setHasAudioAccess] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showHealthConditions, setShowHealthConditions] = useState(false);
  const [isConnectButtonFading, setIsConnectButtonFading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const moveToHealthConditions = useCallback(() => {
    console.log('Moving to health conditions screen');
    setShowCreateAccount(false);
    setShowHealthConditions(true);
  }, [setShowCreateAccount, setShowHealthConditions]);

  const moveBackToAccount = useCallback(() => {
    console.log('Moving back to account screen');
    setShowHealthConditions(false);
    setShowCreateAccount(true);
  }, [setShowCreateAccount, setShowHealthConditions]);

  // Monitor connection status
  useEffect(() => {
    console.log('Connection status changed:', {
      status: conversation.status,
      showCreateAccount,
      showHealthConditions
    });
    // Show create account screen only after connecting
    if (conversation.status === "connected") {
      if (!showCreateAccount && !showHealthConditions) {
        console.log('Setting showCreateAccount to true from useEffect');
        setShowCreateAccount(true);
      }
    } else {
      // Reset states when disconnected
      setShowCreateAccount(false);
      setShowHealthConditions(false);
    }
  }, [conversation.status, showCreateAccount, showHealthConditions]);

  // Audio stream handling
  const requestAudioPermissions = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      setHasAudioAccess(true);
      return stream;
    } catch (err) {
      console.error(err);
      toast.error("Please grant audio permissions in site settings to continue");
      setHasAudioAccess(false);
      return null;
    }
  };

  // Cleanup audio stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  const endCall = async () => {
    if (!conversationId) {
      toast.error("Conversation not found");
      return;
    }

    try {
      await conversation?.endSession();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      // Reset all states to initial values
      setIsCollecting(false);
      setConversationId(null);
      setShowCreateAccount(false);
      setShowHealthConditions(false);
      setUserData({});
    } catch (error) {
      console.error("Error ending call:", error);
      toast.error("Failed to end conversation");
    }
  };

  const startCall = async () => {
    setIsConnectButtonFading(true);
    
    try {
      // Only request permissions if we don't already have them
      if (!hasAudioAccess) {
        const stream = await requestAudioPermissions();
        if (!stream) {
          setIsConnectButtonFading(false);
          return;
        }
      }

      const req = await getAgentSignedUrl({});
      const signedUrl = req?.data?.signedUrl;
      if (!signedUrl) {
        setIsConnectButtonFading(false);
        throw new Error("Failed to get signed URL");
      }

      console.log('Starting session with URL:', signedUrl);
      
      await conversation.startSession({
        signedUrl,
        onConnect: ({ conversationId }) => {
          console.log('Connected to agent:', conversationId);
          setConversationId(conversationId);
          setIsCollecting(true);
          setShowCreateAccount(true);
        },
        onError: (error) => {
          console.error('Connection error:', error);
          toast.error("Connection error occurred");
          setIsConnectButtonFading(false);
          setIsCollecting(false);
          setConversationId(null);
        },
        onDisconnect: () => {
          console.log('Disconnected from agent');
          setIsCollecting(false);
          setConversationId(null);
          setShowCreateAccount(false);
          setShowHealthConditions(false);
        },
        clientTools: {
          triggerFirstName(parameters: { firstName: string }) {
            console.log('triggerFirstName called with parameters:', parameters);
            if (!parameters?.firstName?.trim()) {
              console.warn('Invalid firstName parameter received:', parameters);
              return;
            }
            
            setUserData(prev => {
              const newData = {
                ...prev,
                firstName: parameters.firstName.trim(),
              };
              console.log('Updating userData with firstName:', newData);
              return newData;
            });
          },
          triggerLastName(parameters: { lastName: string }) {
            console.log('triggerLastName called with parameters:', parameters);
            if (!parameters?.lastName?.trim()) {
              console.warn('Invalid lastName parameter received:', parameters);
              return;
            }
            
            setUserData(prev => {
              const newData = {
                ...prev,
                lastName: parameters.lastName.trim()
              };
              console.log('Updating userData with lastName:', newData);
              return newData;
            });
          },
          triggerRole(parameters: { role: "Primary User" | "Caregiver" }) {
            console.log('triggerRole called with parameters:', parameters);
            if (!parameters.role) {
              console.warn('Received empty role parameter:', parameters);
              return;
            }
            setUserData(prev => ({
              ...prev,
              role: parameters.role,
            }));
          },
          triggerDateOfBirth: async (parameters: { dateOfBirth: string }) => {
            console.log('triggerDateOfBirth called with parameters:', parameters);
            if (!parameters.dateOfBirth) {
              console.warn('Received empty dateOfBirth parameter:', parameters);
              return;
            }
            setUserData(prev => ({
              ...prev,
              dateOfBirth: parameters.dateOfBirth,
            }));
          },
          triggerPhone: async (parameters: { phone: string }) => {
            console.log('triggerPhone called with parameters:', parameters);
            if (!parameters.phone) {
              console.warn('Received empty phone parameter:', parameters);
              return;
            }
            // Clean the phone number to only include digits
            const cleanedPhone = parameters.phone.replace(/\D/g, '');
            if (cleanedPhone.length !== 10) {
              console.warn('Invalid phone number format:', parameters.phone);
              return;
            }
            setUserData(prev => ({
              ...prev,
              phone: cleanedPhone,
            }));
          },
          triggerAccountReview: async (parameters: { accountReview: boolean }) => {
            console.log('triggerAccountReview called with parameters:', parameters);
            if (parameters.accountReview) {
              console.log('Account details confirmed, moving to health conditions');
              moveToHealthConditions();
            } else {
              console.log('Account details need correction, staying on account screen');
              // Stay on current screen
            }
          },
          triggerHealthCondition: async (parameters: { 
            conditionName: string;
            conditionKey: string;
          }) => {
            console.log('triggerHealthCondition called with parameters:', parameters);
            if (!parameters.conditionName?.trim() || !parameters.conditionKey?.trim()) {
              console.warn('Received empty health condition parameters:', parameters);
              return;
            }
            
            setUserData(prev => {
              const existingConditions = prev.healthConditions || [];
              
              // Only add if it's not already in the list
              if (!existingConditions.some(c => c.key === parameters.conditionKey)) {
                const newData = {
                  ...prev,
                  healthConditions: [...existingConditions, { 
                    key: parameters.conditionKey, 
                    name: parameters.conditionName.trim() 
                  }]
                };
                console.log('Updated health conditions:', newData.healthConditions);
                return newData;
              }
              return prev;
            });

            // Ensure we're on the health conditions screen
            if (!showHealthConditions) {
              moveToHealthConditions();
            }
          },
          triggerRemoveHealthCondition: async (parameters: { key: string }) => {
            console.log('triggerRemoveHealthCondition called with parameters:', parameters);
            if (!parameters.key?.trim()) {
              console.warn('Received empty health condition key:', parameters);
              return;
            }
            
            setUserData(prev => {
              const existingConditions = prev.healthConditions || [];
              const newData = {
                ...prev,
                healthConditions: existingConditions.filter(c => c.key !== parameters.key)
              };
              console.log('Updated health conditions after removal:', newData.healthConditions);
              return newData;
            });
          },
          triggerShowMedications: async () => {
            console.log('Moving to medications screen');
            setShowHealthConditions(false);
            setUserData(prev => ({
              ...prev,
              showMedications: true
            }));
          },
          triggerSelectMedication: async (parameters: { number: number }) => {
            console.log('triggerSelectMedication called with parameters:', parameters);
            
            setUserData(prev => {
              const medications = prev.medications || [];
              const medicationIndex = parameters.number - 1; // Convert 1-based to 0-based index
              
              if (medicationIndex >= 0 && medicationIndex < medications.length) {
                return {
                  ...prev,
                  currentMedicationId: medications[medicationIndex].id
                };
              }
              return prev;
            });
          },
          triggerAddMedication: async (parameters: {
            name: string,
            strength: string,
            form: string
          }) => {
            console.log('Adding/updating medication:', parameters);
            
            if (!parameters?.name) {
              console.warn('Invalid medication name:', parameters);
              return;
            }

            setUserData(prev => {
              const medications = [...(prev.medications || [])];
              const existingIndex = medications.findIndex(
                med => (med?.name || '').toLowerCase() === parameters.name.toLowerCase()
              );

              if (existingIndex >= 0) {
                // Update existing medication
                medications[existingIndex] = {
                  ...medications[existingIndex],
                  name: parameters.name,
                  strength: parameters.strength || '',
                  form: parameters.form || ''
                };
                console.log('Updated existing medication at index:', existingIndex);
              } else {
                // Add new medication
                medications.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: parameters.name,
                  strength: parameters.strength || '',
                  form: parameters.form || '',
                  doses: [],
                  asNeeded: 0
                });
                console.log('Added new medication');
              }

              return {
                ...prev,
                medications
              };
            });
          },
          triggerAddDose: async (parameters: {
            name: string,
            times: string,
            days: string[],
            pillCount: number
          }) => {
            console.log('Adding dose with parameters:', JSON.stringify(parameters, null, 2));
            
            // Validate medication name
            if (!parameters.name) {
              console.warn('Missing medication name');
              return;
            }

            // Validate time format
            if (!parameters.times || !/^\d{1,2}:\d{2}(AM|PM)$/i.test(parameters.times.replace(/\s+/g, ''))) {
              console.warn('Invalid time format:', parameters.times);
              return;
            }

            // Validate days array
            if (!Array.isArray(parameters.days) || parameters.days.length === 0) {
              console.warn('Invalid days array:', parameters.days);
              return;
            }

            // Validate pill count
            if (typeof parameters.pillCount !== 'number' || parameters.pillCount <= 0) {
              console.warn('Invalid pill count:', parameters.pillCount);
              return;
            }

            setUserData(prev => {
              const medications = [...(prev.medications || [])];
              const medIndex = medications.findIndex(
                med => med?.name?.toLowerCase() === parameters.name.toLowerCase()
              );

              if (medIndex === -1) {
                console.warn('Medication not found:', parameters.name);
                return prev;
              }

              const medication = {...medications[medIndex]};
              const doses = [...(medication.doses || [])];
              const formattedTime = formatDoseTime(parameters.times);
              const sortedDays = [...parameters.days].sort();

              console.log('Adding dose:', {
                medication: medication.name,
                time: formattedTime,
                days: sortedDays,
                pillCount: parameters.pillCount
              });

              // Check if this exact dose already exists
              const existingDoseIndex = doses.findIndex(dose => 
                formatDoseTime(dose?.timeOfDay || '') === formattedTime &&
                arraysEqual(dose?.specificDays || [], sortedDays)
              );

              if (existingDoseIndex >= 0) {
                // Update existing dose's pill count
                doses[existingDoseIndex] = {
                  timeOfDay: formattedTime,
                  specificDays: sortedDays,
                  pillCount: parameters.pillCount
                };
                console.log('Updated existing dose');
              } else {
                // Add new dose
                doses.push({
                  timeOfDay: formattedTime,
                  specificDays: sortedDays,
                  pillCount: parameters.pillCount
                });
                console.log('Added new dose');
              }

              medication.doses = doses;
              medications[medIndex] = medication;

              return {
                ...prev,
                medications
              };
            });
          },
          triggerAsNeeded: async (parameters: {
            name: string;
            asNeeded: number;
          }) => {
            console.log('Setting medication as-needed status:', parameters);
            
            setUserData(prev => {
              const medications = prev.medications || [];
              const medicationIndex = medications.findIndex(
                m => m.name?.toLowerCase() === parameters.name?.toLowerCase()
              );
              
              if (medicationIndex === -1) return prev;
              
              const updatedMedications = [...medications];
              updatedMedications[medicationIndex] = {
                ...updatedMedications[medicationIndex],
                asNeeded: parameters.asNeeded
              };
              
              return {
                ...prev,
                medications: updatedMedications
              };
            });
          },
          triggerRemoveDose: async (parameters: {
            name: string,
            time: string,
            days: string[]
          }) => {
            console.log('triggerRemoveDose called with parameters:', parameters);
            
            if (!parameters?.name || !parameters?.time || !parameters?.days) {
              console.warn('Invalid remove dose parameters:', parameters);
              return;
            }

            setUserData(prev => {
              const medications = prev.medications || [];
              const medicationIndex = medications.findIndex(
                m => (m?.name || '').toLowerCase() === parameters.name.toLowerCase()
              );
              
              if (medicationIndex === -1) {
                console.warn('Medication not found:', parameters.name);
                return prev;
              }
              
              const updatedMedications = [...medications];
              const medication = { ...updatedMedications[medicationIndex] };
              
              if (!medication.doses) {
                return prev;
              }
              
              // Find the exact dose to remove using both time and days
              const doseIndex = medication.doses.findIndex(d => 
                formatDoseTime(d?.timeOfDay || '') === formatDoseTime(parameters.time) &&
                arraysEqual(d?.specificDays || [], parameters.days)
              );
              
              if (doseIndex === -1) {
                console.warn(`Could not find dose with time ${parameters.time} and days ${parameters.days.join(', ')}`);
                return prev;
              }
              
              // Remove the dose
              medication.doses = medication.doses.filter((_, index) => index !== doseIndex);
              updatedMedications[medicationIndex] = medication;
              
              console.log(`Removed dose at ${parameters.time} for ${parameters.days.join(', ')}`);
              
              return {
                ...prev,
                medications: updatedMedications
              };
            });
          },
          triggerUpdateDose: async (parameters: {
            medicationName: string,
            oldTime: string,
            oldDays: string[],
            newTime: string,
            newDays: string[],
            newPillCount: number
          }) => {
            console.log('Updating dose:', parameters);
            
            if (!parameters?.medicationName || !parameters?.oldTime || !parameters?.oldDays || 
                !parameters?.newTime || !parameters?.newDays || parameters?.newPillCount == null) {
              console.warn('Invalid update dose parameters:', parameters);
              return;
            }

            setUserData(prev => {
              const medications = [...(prev.medications || [])];
              const medIndex = medications.findIndex(
                med => (med?.name || '').toLowerCase() === parameters.medicationName.toLowerCase()
              );

              if (medIndex === -1) {
                console.log('Medication not found:', parameters.medicationName);
                return prev;
              }

              const medication = {...medications[medIndex]};
              const doses = [...(medication.doses || [])];
              
              // Find the exact dose to update
              const doseIndex = doses.findIndex(dose => 
                formatDoseTime(dose?.timeOfDay || '') === formatDoseTime(parameters.oldTime) &&
                arraysEqual(dose?.specificDays || [], parameters.oldDays)
              );

              if (doseIndex === -1) {
                console.log('Dose not found:', parameters.oldTime, parameters.oldDays);
                return prev;
              }

              // Update the dose with new values
              doses[doseIndex] = {
                timeOfDay: formatDoseTime(parameters.newTime),
                specificDays: parameters.newDays,
                pillCount: parameters.newPillCount
              };

              medication.doses = doses;
              medications[medIndex] = medication;

              console.log(`Updated dose from ${parameters.oldTime} to ${parameters.newTime}`);

              return {
                ...prev,
                medications
              };
            });
          },
          triggerMedicationUpdate: async (parameters: FlatMedicationUpdate) => {
            console.log('Updating medication with parameters:', JSON.stringify(parameters, null, 2));
            
            // Validate basic medication info
            if (!parameters.name || !parameters.medicationKey || !parameters.strength || !parameters.form) {
              console.warn('Missing required medication information');
              toast.error('Medication name, key, strength, and form are required');
              return;
            }

            // Validate arrays have matching lengths
            if (!Array.isArray(parameters.times) || !Array.isArray(parameters.days) || !Array.isArray(parameters.pillCounts)) {
              console.warn('Times, days, and pillCounts must be arrays');
              toast.error('Invalid dose information provided');
              return;
            }

            if (parameters.times.length !== parameters.pillCounts.length) {
              console.warn('Number of times must match number of pill counts');
              toast.error('Mismatched dose information');
              return;
            }

            // Validate each time
            for (const time of parameters.times) {
              if (!time || !/^\d{1,2}:\d{2}(AM|PM)$/i.test(time.replace(/\s+/g, ''))) {
                console.warn('Invalid time format:', time);
                toast.error(`Invalid time format for ${time}. Must be H:MMAM/PM`);
                return;
              }
            }

            // Validate days
            if (parameters.days.length === 0) {
              console.warn('Days array is empty');
              toast.error('At least one day must be specified');
              return;
            }

            // Validate pill counts
            if (parameters.pillCounts.some(count => typeof count !== 'number' || count <= 0)) {
              console.warn('Invalid pill count found');
              toast.error('All pill counts must be positive numbers');
              return;
            }

            setUserData(prev => {
              const medications = [...(prev.medications || [])];
              const medIndex = medications.findIndex(
                med => med?.id === parameters.medicationKey
              );

              // Convert flat arrays into dose objects
              const doses = parameters.times.map((time, index) => ({
                timeOfDay: formatDoseTime(time),
                specificDays: [...parameters.days].sort(),
                pillCount: parameters.pillCounts[index]
              }));

              const newMedication = {
                id: parameters.medicationKey,
                name: parameters.name,
                strength: parameters.strength,
                form: parameters.form,
                doses,
                asNeeded: parameters.asNeeded || 0
              };

              if (medIndex >= 0) {
                // Update existing medication
                medications[medIndex] = newMedication;
                console.log('Updated existing medication:', JSON.stringify(newMedication, null, 2));
                toast.success(`Updated medication: ${parameters.name}`);
              } else {
                // Add new medication
                medications.push(newMedication);
                console.log('Added new medication:', JSON.stringify(newMedication, null, 2));
                toast.success(`Added medication: ${parameters.name}`);
              }

              return {
                ...prev,
                medications
              };
            });
          },
        },
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to start conversation");
      setIsCollecting(false);
      setConversationId(null);
      setIsConnectButtonFading(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {!showCreateAccount && !showHealthConditions ? (
        // Initial Call Button Layout
        <div className="flex-1 flex items-center justify-center relative min-h-screen">
          {/* Radial Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#F26C3A] to-transparent opacity-20" />
          </div>
          
          {/* Call Button */}
          <div className={cn(
            "relative z-10 transition-all duration-500",
            isConnectButtonFading && "opacity-0 transform scale-95"
          )}>
            <CallButton
              status={conversation.status}
              startCall={startCall}
              hasMediaAccess={hasAudioAccess}
              requestMediaPermissions={requestAudioPermissions}
            />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 h-screen flex flex-col">
          {/* Header and Content Container */}
          <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full">
              <ConversationCard
                isOpen={isCollecting}
                setIsOpen={setIsCollecting}
                conversation={conversation}
                endCall={endCall}
                userData={userData}
                startCall={startCall}
                hasAudioAccess={hasAudioAccess}
                requestAudioPermissions={requestAudioPermissions}
                onNext={moveToHealthConditions}
                onBack={moveBackToAccount}
                showHealthConditions={showHealthConditions}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
