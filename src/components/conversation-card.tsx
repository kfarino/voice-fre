"use client";

import { useConversation } from "@11labs/react";

interface ConversationData {
  firstName?: string;
  lastName?: string;
  role?: "Primary User" | "Caregiver";
  dateOfBirth?: string;
  phone?: string;
  healthConditions?: Array<{ key: string; name: string }>;
}

interface ConversationCardProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  conversation: ReturnType<typeof useConversation>;
  endCall: () => void;
  userData: ConversationData;
  startCall: () => void;
  hasAudioAccess: boolean;
  requestAudioPermissions: () => void;
  onNext: () => void;
  onBack: () => void;
  showHealthConditions?: boolean;
}

export function ConversationCard({
  conversation,
  endCall,
  userData,
  showHealthConditions = false,
}: ConversationCardProps) {
  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <div className="tablet-container">
      {conversation.status === "connected" && (
        <>
          {!showHealthConditions ? (
            // Account Creation Screen
            <div className="space-y-6">
              {/* User Data Display */}
              <div className="flex flex-col gap-[20px] w-fit">
                <div className="grid grid-cols-[1fr_auto_1fr] items-baseline">
                  <div className="text-right whitespace-nowrap">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>📝 Name</span>
                  </div>
                  <div className="w-[50px] flex justify-center">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div className="pl-[50px]">
                    {(userData.firstName || userData.lastName) ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2 whitespace-nowrap" style={{ fontSize: '40px' }}>
                        {userData.firstName} {userData.lastName}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '40px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-baseline">
                  <div className="text-right whitespace-nowrap">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>👤 Role</span>
                  </div>
                  <div className="w-[50px] flex justify-center">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div className="pl-[50px]">
                    {userData.role ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2 whitespace-nowrap" style={{ fontSize: '40px' }}>
                        {userData.role}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '40px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-baseline">
                  <div className="text-right whitespace-nowrap">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>🎂 Date of Birth</span>
                  </div>
                  <div className="w-[50px] flex justify-center">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div className="pl-[50px]">
                    {userData.dateOfBirth ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2 whitespace-nowrap" style={{ fontSize: '40px' }}>
                        {userData.dateOfBirth}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '40px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-baseline">
                  <div className="text-right whitespace-nowrap">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>📞 Phone</span>
                  </div>
                  <div className="w-[50px] flex justify-center">
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div className="pl-[50px]">
                    {userData.phone ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2 whitespace-nowrap" style={{ fontSize: '40px' }}>
                        {formatPhoneNumber(userData.phone)}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '40px' }}>&nbsp;</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Health Conditions Screen - Center aligned
            <div className="flex flex-col items-center mt-20">
              {/* Health Conditions List */}
              <div className="flex flex-col gap-[40px] w-fit">
                {userData.healthConditions && userData.healthConditions.length > 0 && (
                  userData.healthConditions.map((condition) => (
                    <div key={condition.key} className="text-center">
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2 whitespace-nowrap text-white" style={{ fontSize: '40px' }}>
                        {condition.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 