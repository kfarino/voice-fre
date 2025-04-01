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
    // Show create account screen only after connecting
    if (conversation.status === "connected" && !showCreateAccount && !showHealthConditions) {
      setShowCreateAccount(true);
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
    // Start fade animation
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

      await conversation.startSession({
        signedUrl,
        onConnect: ({ conversationId }) => {
          console.log('Connected to agent:', conversationId);
          setConversationId(conversationId);
          setIsCollecting(true);
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
          triggerRole: async (parameters: { role: "Primary User" | "Caregiver" }) => {
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
            name?: string;
            strength?: string;
            form?: string;
            asNeeded?: number;
            correctFrom?: string;  // Name of the medication to correct from
          }) => {
            console.log('triggerAddMedication called with parameters:', parameters);
            
            setUserData(prev => {
              console.log('Previous userData:', prev);
              const medications = prev.medications || [];
              
              if (parameters.name) {
                // Handle medication correction
                if (parameters.correctFrom) {
                  const oldMedIndex = medications.findIndex(
                    m => m.name?.toLowerCase() === parameters.correctFrom?.toLowerCase()
                  );
                  
                  if (oldMedIndex >= 0) {
                    // Get the old medication's doses
                    const oldMedication = medications[oldMedIndex];
                    const oldDoses = oldMedication.doses || [];
                    
                    // Create new medication with the old doses
                    const newMedication = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: parameters.name,
                      strength: parameters.strength || oldMedication.strength,
                      form: parameters.form || oldMedication.form,
                      doses: [...oldDoses],  // Transfer all doses
                      asNeeded: parameters.asNeeded !== undefined ? parameters.asNeeded : oldMedication.asNeeded
                    };
                    
                    // Remove old medication and add new one
                    const updatedMedications = medications.filter((_, index) => index !== oldMedIndex);
                    updatedMedications.push(newMedication);
                    
                    console.log('Corrected medication:', newMedication);
                    
                    return {
                      ...prev,
                      medications: updatedMedications,
                      currentMedicationId: newMedication.id
                    };
                  }
                }
                
                // If we have a currentMedicationId, update that medication
                if (prev.currentMedicationId) {
                  const currentMedIndex = medications.findIndex(m => m.id === prev.currentMedicationId);
                  if (currentMedIndex >= 0) {
                    const updatedMedications = [...medications];
                    const existingMed = { ...updatedMedications[currentMedIndex] };
                    
                    // Update all provided fields
                    existingMed.name = parameters.name;
                    if (parameters.strength) existingMed.strength = parameters.strength;
                    if (parameters.form) existingMed.form = parameters.form;
                    if (parameters.asNeeded !== undefined) existingMed.asNeeded = parameters.asNeeded;
                    
                    updatedMedications[currentMedIndex] = existingMed;
                    console.log('Updated existing medication by ID:', existingMed);
                    
                    return {
                      ...prev,
                      medications: updatedMedications
                    };
                  }
                }
                
                // Check if we already have a medication with this name
                const existingMedIndex = medications.findIndex(
                  m => m.name?.toLowerCase() === parameters.name?.toLowerCase()
                );
                console.log('Existing medication index:', existingMedIndex);
                
                if (existingMedIndex >= 0) {
                  // Update existing medication
                  const updatedMedications = [...medications];
                  const existingMed = { ...updatedMedications[existingMedIndex] };
                  
                  // Update the fields that are provided
                  if (parameters.strength) existingMed.strength = parameters.strength;
                  if (parameters.form) existingMed.form = parameters.form;
                  if (parameters.asNeeded !== undefined) existingMed.asNeeded = parameters.asNeeded;
                  
                  updatedMedications[existingMedIndex] = existingMed;
                  console.log('Updated existing medication:', existingMed);
                  
                  return {
                    ...prev,
                    medications: updatedMedications,
                    currentMedicationId: existingMed.id
                  };
                }
                
                // Create new medication
                const newMedication = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: parameters.name,
                  strength: parameters.strength,
                  form: parameters.form,
                  doses: [],
                  asNeeded: parameters.asNeeded || 0  // Default to 0 if not specified
                };
                console.log('Created new medication:', newMedication);
                
                return {
                  ...prev,
                  medications: [...medications, newMedication],
                  currentMedicationId: newMedication.id
                };
              }
              return prev;
            });
          },
          triggerAddDose: async (parameters: {
            name: string;
            pillCount: number;
            times: string | string[];  // Allow both single string and array
            days: string[];
          }) => {
            console.log('triggerAddDose called with parameters:', parameters);
            
            setUserData((prevData: ConversationData) => {
              console.log('Previous userData in addDose:', prevData);
              const medications = prevData.medications || [];
              const medicationIndex = medications.findIndex(
                m => m.name?.toLowerCase() === parameters.name.toLowerCase()
              );
              console.log('Found medication index:', medicationIndex);

              if (medicationIndex === -1) {
                console.warn('Medication not found:', parameters.name);
                return prevData;
              }

              const updatedMedications = [...medications];
              const medication = { ...updatedMedications[medicationIndex] };
              console.log('Current medication before update:', medication);
              
              // Initialize doses array if it doesn't exist
              if (!medication.doses) {
                medication.doses = [];
              }

              // Convert times to array if it's a single string
              const times = Array.isArray(parameters.times) ? parameters.times : [parameters.times];

              // For each time in the parameters
              times.forEach(time => {
                // Check if a dose with this time and days already exists
                const doses = medication.doses!; // We know doses exists because we initialized it above
                const existingDoseIndex = doses.findIndex(d => 
                  d.timeOfDay === time && 
                  d.specificDays?.length === parameters.days.length &&
                  d.specificDays?.every(day => parameters.days.includes(day))
                );

                if (existingDoseIndex !== -1) {
                  // Update existing dose
                  doses[existingDoseIndex] = {
                    pillCount: parameters.pillCount,
                    timeOfDay: time,
                    specificDays: [...parameters.days]
                  };
                } else {
                  // Add new dose
                  doses.push({
                    pillCount: parameters.pillCount,
                    timeOfDay: time,
                    specificDays: [...parameters.days]
                  });
                }
              });

              updatedMedications[medicationIndex] = medication;
              console.log('Updated medication:', medication);

              return {
                ...prevData,
                medications: updatedMedications
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
