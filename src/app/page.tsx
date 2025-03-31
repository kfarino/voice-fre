"use client";

import { ConversationCard } from "@/components/conversation-card";
import { CallButton } from "@/components/call-button";
import { getAgentSignedUrl } from "./actions/actions";
import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RoleSelector } from "@/components/role-selector";
import { cn } from "@/lib/utils";

interface ConversationData {
  firstName?: string;
  lastName?: string;
  role?: "Primary User" | "Caregiver";
  dateOfBirth?: string;
  phone?: string;
  healthConditions?: { key: string; name: string }[];
}

export default function Home() {
  const conversation = useConversation();
  const [isCollecting, setIsCollecting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userData, setUserData] = useState<ConversationData>({});
  const [hasAudioAccess, setHasAudioAccess] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showHealthConditions, setShowHealthConditions] = useState(false);
  const [isConnectButtonFading, setIsConnectButtonFading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

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

  // Monitor userData changes
  useEffect(() => {
    console.log('userData updated:', userData);
    
    // Show create account screen immediately after connecting
    if (!showCreateAccount && !showHealthConditions && conversation.status === "connected") {
      setShowCreateAccount(true);
    }
  }, [userData, showCreateAccount, showHealthConditions, conversation.status]);

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
    setIsEndingCall(true);

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
    } finally {
      setIsEndingCall(false);
    }
  };

  const handleRoleSelect = async (role: "Primary User" | "Caregiver") => {
    setUserData(prev => ({
      ...prev,
      role: role
    }));
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
                lastName: parameters.lastName.trim(),
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
          {/* Header */}
          <div className="pt-6 px-4">
            <div className="relative text-center mb-12 max-w-[1200px] mx-auto grid grid-cols-[1fr_auto_1fr]">
              {showHealthConditions && (
                <button 
                  onClick={moveBackToAccount}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[48px] h-[48px] rounded-full bg-black border-2 border-white !text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ backgroundColor: 'black' }}
                  aria-label="Go back"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="!text-white">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="col-start-2 text-center">
                <h1 className="text-white/60" style={{ fontSize: '40px' }}>
                  {showHealthConditions ? "Health Conditions" : "Create Your Account"}
                </h1>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
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
      )}
    </main>
  );
}
